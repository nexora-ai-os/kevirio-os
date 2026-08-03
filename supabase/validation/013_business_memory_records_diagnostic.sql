BEGIN TRANSACTION READ ONLY;

WITH expected_columns AS (
  SELECT *
  FROM (
    VALUES
      (1,  'id',                 'uuid'),
      (2,  'workspace_id',       'uuid'),
      (3,  'revenue_engine_id',  'uuid'),
      (4,  'source_type',        'text'),
      (5,  'source_id',          'text'),
      (6,  'statement',          'text'),
      (7,  'evidence_status',    'text'),
      (8,  'confidence',         'numeric(5,4)'),
      (9,  'status',             'text'),
      (10, 'expires_at',         'timestamp with time zone'),
      (11, 'metadata',           'jsonb'),
      (12, 'raw_content_stored', 'boolean'),
      (13, 'retention_until',    'timestamp with time zone'),
      (14, 'created_at',         'timestamp with time zone'),
      (15, 'updated_at',         'timestamp with time zone')
  ) AS expected_column(
    ordinal_position,
    column_name,
    expected_data_type
  )
),
target_object AS (
  SELECT
    class_row.oid AS object_oid,
    namespace_row.nspname AS schema_name,
    class_row.relname AS object_name,
    class_row.relkind AS relation_kind,
    class_row.relrowsecurity AS rls_enabled,
    class_row.relforcerowsecurity AS rls_forced,
    obj_description(class_row.oid, 'pg_class') AS object_comment
  FROM pg_class AS class_row
  JOIN pg_namespace AS namespace_row
    ON namespace_row.oid = class_row.relnamespace
  WHERE namespace_row.nspname = 'public'
    AND class_row.relname = 'business_memory_records'
),
actual_columns AS (
  SELECT
    attribute_row.attnum AS ordinal_position,
    attribute_row.attname AS column_name,
    pg_catalog.format_type(
      attribute_row.atttypid,
      attribute_row.atttypmod
    ) AS actual_data_type,
    attribute_row.attnotnull AS is_not_null,
    pg_get_expr(
      default_row.adbin,
      default_row.adrelid
    ) AS default_expression
  FROM target_object AS target
  JOIN pg_attribute AS attribute_row
    ON attribute_row.attrelid = target.object_oid
  LEFT JOIN pg_attrdef AS default_row
    ON default_row.adrelid = attribute_row.attrelid
   AND default_row.adnum = attribute_row.attnum
  WHERE attribute_row.attnum > 0
    AND NOT attribute_row.attisdropped
),
missing_columns AS (
  SELECT
    expected.ordinal_position,
    expected.column_name,
    expected.expected_data_type
  FROM expected_columns AS expected
  LEFT JOIN actual_columns AS actual
    ON actual.column_name = expected.column_name
  WHERE actual.column_name IS NULL
),
unexpected_columns AS (
  SELECT
    actual.ordinal_position,
    actual.column_name,
    actual.actual_data_type,
    actual.is_not_null,
    actual.default_expression
  FROM actual_columns AS actual
  LEFT JOIN expected_columns AS expected
    ON expected.column_name = actual.column_name
  WHERE expected.column_name IS NULL
),
incompatible_column_types AS (
  SELECT
    expected.ordinal_position,
    expected.column_name,
    expected.expected_data_type,
    actual.actual_data_type
  FROM expected_columns AS expected
  JOIN actual_columns AS actual
    ON actual.column_name = expected.column_name
  WHERE actual.actual_data_type <> expected.expected_data_type
),
primary_key_details AS (
  SELECT
    constraint_row.oid AS constraint_oid,
    constraint_row.conname AS constraint_name,
    pg_get_constraintdef(
      constraint_row.oid,
      true
    ) AS constraint_definition
  FROM target_object AS target
  JOIN pg_constraint AS constraint_row
    ON constraint_row.conrelid = target.object_oid
  WHERE constraint_row.contype = 'p'
),
foreign_key_details AS (
  SELECT
    constraint_row.oid AS constraint_oid,
    constraint_row.conname AS constraint_name,
    referenced_namespace.nspname AS referenced_schema,
    referenced_table.relname AS referenced_table,
    pg_get_constraintdef(
      constraint_row.oid,
      true
    ) AS constraint_definition,
    constraint_row.convalidated AS is_validated,
    constraint_row.condeferrable AS is_deferrable,
    constraint_row.condeferred AS is_initially_deferred
  FROM target_object AS target
  JOIN pg_constraint AS constraint_row
    ON constraint_row.conrelid = target.object_oid
  JOIN pg_class AS referenced_table
    ON referenced_table.oid = constraint_row.confrelid
  JOIN pg_namespace AS referenced_namespace
    ON referenced_namespace.oid = referenced_table.relnamespace
  WHERE constraint_row.contype = 'f'
),
index_details AS (
  SELECT
    index_table.oid AS index_oid,
    index_namespace.nspname AS index_schema,
    index_table.relname AS index_name,
    index_row.indisprimary AS is_primary,
    index_row.indisunique AS is_unique,
    index_row.indisvalid AS is_valid,
    index_row.indisready AS is_ready,
    pg_get_indexdef(index_table.oid) AS index_definition
  FROM target_object AS target
  JOIN pg_index AS index_row
    ON index_row.indrelid = target.object_oid
  JOIN pg_class AS index_table
    ON index_table.oid = index_row.indexrelid
  JOIN pg_namespace AS index_namespace
    ON index_namespace.oid = index_table.relnamespace
),
trigger_details AS (
  SELECT
    trigger_row.oid AS trigger_oid,
    trigger_row.tgname AS trigger_name,
    trigger_row.tgenabled AS enabled_state,
    trigger_row.tgisinternal AS is_internal,
    pg_get_triggerdef(
      trigger_row.oid,
      true
    ) AS trigger_definition
  FROM target_object AS target
  JOIN pg_trigger AS trigger_row
    ON trigger_row.tgrelid = target.object_oid
  WHERE NOT trigger_row.tgisinternal
),
policy_details AS (
  SELECT
    policy_row.oid AS policy_oid,
    policy_row.polname AS policy_name,
    CASE policy_row.polcmd
      WHEN 'r' THEN 'SELECT'
      WHEN 'a' THEN 'INSERT'
      WHEN 'w' THEN 'UPDATE'
      WHEN 'd' THEN 'DELETE'
      WHEN '*' THEN 'ALL'
      ELSE policy_row.polcmd::text
    END AS policy_command,
    policy_row.polpermissive AS is_permissive,
    ARRAY(
      SELECT
        CASE
          WHEN role_item.role_oid = 0 THEN 'PUBLIC'
          ELSE COALESCE(
            role_row.rolname,
            role_item.role_oid::text
          )
        END
      FROM unnest(policy_row.polroles)
        AS role_item(role_oid)
      LEFT JOIN pg_roles AS role_row
        ON role_row.oid = role_item.role_oid
    ) AS policy_roles,
    pg_get_expr(
      policy_row.polqual,
      policy_row.polrelid
    ) AS using_expression,
    pg_get_expr(
      policy_row.polwithcheck,
      policy_row.polrelid
    ) AS check_expression
  FROM target_object AS target
  JOIN pg_policy AS policy_row
    ON policy_row.polrelid = target.object_oid
),
constraint_details AS (
  SELECT
    constraint_row.oid AS constraint_oid,
    constraint_row.conname AS constraint_name,
    CASE constraint_row.contype
      WHEN 'p' THEN 'PRIMARY KEY'
      WHEN 'f' THEN 'FOREIGN KEY'
      WHEN 'u' THEN 'UNIQUE'
      WHEN 'c' THEN 'CHECK'
      WHEN 'x' THEN 'EXCLUSION'
      WHEN 'n' THEN 'NOT NULL'
      ELSE constraint_row.contype::text
    END AS constraint_type,
    constraint_row.convalidated AS is_validated,
    constraint_row.condeferrable AS is_deferrable,
    constraint_row.condeferred AS is_initially_deferred,
    pg_get_constraintdef(
      constraint_row.oid,
      true
    ) AS constraint_definition
  FROM target_object AS target
  JOIN pg_constraint AS constraint_row
    ON constraint_row.conrelid = target.object_oid
),
diagnostic_counts AS (
  SELECT
    (
      SELECT count(*)
      FROM target_object
    ) AS object_count,
    (
      SELECT count(*)
      FROM missing_columns
    ) AS missing_column_count,
    (
      SELECT count(*)
      FROM unexpected_columns
    ) AS unexpected_column_count,
    (
      SELECT count(*)
      FROM incompatible_column_types
    ) AS incompatible_column_type_count,
    (
      SELECT count(*)
      FROM primary_key_details
    ) AS primary_key_count,
    (
      SELECT count(*)
      FROM primary_key_details
      WHERE constraint_definition = 'PRIMARY KEY (id)'
    ) AS expected_primary_key_count,
    (
      SELECT count(*)
      FROM foreign_key_details
      WHERE referenced_schema = 'public'
        AND referenced_table = 'workspaces'
        AND constraint_definition LIKE
          'FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id)%'
    ) AS expected_workspace_fk_count,
    (
      SELECT count(*)
      FROM foreign_key_details
      WHERE referenced_schema = 'public'
        AND referenced_table = 'revenue_engines'
        AND constraint_definition LIKE
          'FOREIGN KEY (revenue_engine_id, workspace_id) REFERENCES public.revenue_engines(id, workspace_id)%'
    ) AS expected_revenue_engine_fk_count,
    (
      SELECT count(*)
      FROM index_details
      WHERE index_name =
        'business_memory_workspace_status_expiry_idx'
        AND is_valid
        AND is_ready
    ) AS expected_index_count,
    (
      SELECT count(*)
      FROM trigger_details
      WHERE trigger_name = 'company_touch_updated_at'
        AND enabled_state <> 'D'
    ) AS expected_updated_at_trigger_count,
    (
      SELECT count(*)
      FROM policy_details
      WHERE policy_name = 'company_owner_read'
        AND policy_command = 'SELECT'
    ) AS expected_owner_read_policy_count,
    COALESCE(
      (
        SELECT rls_enabled
        FROM target_object
      ),
      false
    ) AS rls_enabled
),
compatibility AS (
  SELECT
    counts.object_count,
    counts.missing_column_count,
    counts.unexpected_column_count,
    counts.incompatible_column_type_count,
    counts.primary_key_count,
    counts.expected_primary_key_count,
    counts.expected_workspace_fk_count,
    counts.expected_revenue_engine_fk_count,
    counts.expected_index_count,
    counts.expected_updated_at_trigger_count,
    counts.expected_owner_read_policy_count,
    counts.rls_enabled,
    (
      counts.object_count = 1
      AND counts.missing_column_count = 0
      AND counts.unexpected_column_count = 0
      AND counts.incompatible_column_type_count = 0
      AND counts.primary_key_count = 1
      AND counts.expected_primary_key_count = 1
      AND counts.expected_workspace_fk_count = 1
      AND counts.expected_revenue_engine_fk_count = 1
      AND counts.expected_index_count = 1
      AND counts.expected_updated_at_trigger_count = 1
      AND counts.rls_enabled
      AND counts.expected_owner_read_policy_count = 1
    ) AS matches_migration_013_structure
  FROM diagnostic_counts AS counts
)
SELECT
  'public.business_memory_records' AS inspected_object,
  EXISTS (
    SELECT 1
    FROM target_object
  ) AS "exists",
  (
    SELECT schema_name
    FROM target_object
  ) AS object_schema,
  (
    SELECT object_oid
    FROM target_object
  ) AS object_oid,
  (
    SELECT
      CASE relation_kind
        WHEN 'r' THEN 'table'
        WHEN 'p' THEN 'partitioned_table'
        WHEN 'v' THEN 'view'
        WHEN 'm' THEN 'materialized_view'
        WHEN 'f' THEN 'foreign_table'
        WHEN 'S' THEN 'sequence'
        WHEN 'i' THEN 'index'
        WHEN 'I' THEN 'partitioned_index'
        WHEN 'c' THEN 'composite_type'
        ELSE relation_kind::text
      END
    FROM target_object
  ) AS object_type,
  (
    SELECT object_comment
    FROM target_object
  ) AS catalog_comment,
  CAST(NULL AS timestamp with time zone)
    AS created_at_from_catalog_if_available,
  'PostgreSQL catalogs do not record table creation time or the migration that created a table.'
    AS catalog_provenance_limitation,
  COALESCE(
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'ordinal_position', ordinal_position,
          'column_name', column_name,
          'expected_type', expected_data_type
        )
        ORDER BY ordinal_position
      )
      FROM missing_columns
    ),
    '[]'::jsonb
  ) AS missing_columns,
  COALESCE(
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'ordinal_position', ordinal_position,
          'column_name', column_name,
          'actual_type', actual_data_type,
          'not_null', is_not_null,
          'default_expression', default_expression
        )
        ORDER BY ordinal_position
      )
      FROM unexpected_columns
    ),
    '[]'::jsonb
  ) AS unexpected_columns,
  COALESCE(
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'ordinal_position', ordinal_position,
          'column_name', column_name,
          'expected_type', expected_data_type,
          'actual_type', actual_data_type
        )
        ORDER BY ordinal_position
      )
      FROM incompatible_column_types
    ),
    '[]'::jsonb
  ) AS incompatible_column_types,
  COALESCE(
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'constraint_name', constraint_name,
          'definition', constraint_definition
        )
        ORDER BY constraint_name
      )
      FROM primary_key_details
    ),
    '[]'::jsonb
  ) AS primary_key,
  COALESCE(
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'constraint_name', constraint_name,
          'referenced_schema', referenced_schema,
          'referenced_table', referenced_table,
          'definition', constraint_definition,
          'validated', is_validated,
          'is_deferrable', is_deferrable,
          'is_initially_deferred', is_initially_deferred
        )
        ORDER BY constraint_name
      )
      FROM foreign_key_details
    ),
    '[]'::jsonb
  ) AS foreign_keys,
  COALESCE(
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'index_schema', index_schema,
          'index_name', index_name,
          'is_primary', is_primary,
          'is_unique', is_unique,
          'is_valid', is_valid,
          'is_ready', is_ready,
          'definition', index_definition
        )
        ORDER BY index_name
      )
      FROM index_details
    ),
    '[]'::jsonb
  ) AS indexes,
  COALESCE(
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'trigger_name', trigger_name,
          'enabled_state', enabled_state,
          'definition', trigger_definition
        )
        ORDER BY trigger_name
      )
      FROM trigger_details
    ),
    '[]'::jsonb
  ) AS triggers,
  jsonb_build_object(
    'enabled',
      COALESCE(
        (
          SELECT rls_enabled
          FROM target_object
        ),
        false
      ),
    'forced',
      COALESCE(
        (
          SELECT rls_forced
          FROM target_object
        ),
        false
      )
  ) AS rls,
  COALESCE(
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'policy_name', policy_name,
          'command', policy_command,
          'permissive', is_permissive,
          'roles', policy_roles,
          'using_expression', using_expression,
          'check_expression', check_expression
        )
        ORDER BY policy_name
      )
      FROM policy_details
    ),
    '[]'::jsonb
  ) AS policies,
  COALESCE(
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'constraint_name', constraint_name,
          'constraint_type', constraint_type,
          'validated', is_validated,
          'is_deferrable', is_deferrable,
          'is_initially_deferred', is_initially_deferred,
          'definition', constraint_definition
        )
        ORDER BY constraint_name
      )
      FROM constraint_details
    ),
    '[]'::jsonb
  ) AS constraints,
  CASE
    WHEN compatibility.object_count = 0 THEN
      'NOT_APPLICABLE_OBJECT_ABSENT'
    ELSE
      'NOT_DETERMINABLE_FROM_POSTGRESQL_CATALOGS'
  END AS determination_a_created_by_earlier_migration,
  CASE
    WHEN compatibility.matches_migration_013_structure THEN
      'YES'
    ELSE
      'NO'
  END AS determination_b_compatible,
  CASE
    WHEN compatibility.matches_migration_013_structure THEN
      'YES_STRUCTURALLY'
    ELSE
      'NO_NOT_WITHOUT_SCHEMA_RECONCILIATION'
  END AS determination_c_can_be_safely_reused,
  CASE
    WHEN compatibility.object_count = 0 THEN
      'NO_OBJECT_ABSENT'
    ELSE
      'NOT_DETERMINABLE_FROM_CATALOG_STRUCTURE_ALONE'
  END AS determination_d_must_be_renamed,
  CASE
    WHEN compatibility.object_count = 1
      AND NOT compatibility.matches_migration_013_structure THEN
      'YES_IF_MIGRATION_013_COMPATIBILITY_IS_REQUIRED'
    WHEN compatibility.matches_migration_013_structure THEN
      'NO_STRUCTURAL_COMPATIBILITY_MIGRATION_REQUIRED'
    ELSE
      'NOT_APPLICABLE_OBJECT_ABSENT'
  END AS determination_e_requires_dedicated_compatibility_migration,
  jsonb_build_object(
    'missing_column_count',
      compatibility.missing_column_count,
    'unexpected_column_count',
      compatibility.unexpected_column_count,
    'incompatible_column_type_count',
      compatibility.incompatible_column_type_count,
    'primary_key_count',
      compatibility.primary_key_count,
    'expected_primary_key_count',
      compatibility.expected_primary_key_count,
    'expected_workspace_fk_count',
      compatibility.expected_workspace_fk_count,
    'expected_revenue_engine_fk_count',
      compatibility.expected_revenue_engine_fk_count,
    'expected_index_count',
      compatibility.expected_index_count,
    'expected_updated_at_trigger_count',
      compatibility.expected_updated_at_trigger_count,
    'rls_enabled',
      compatibility.rls_enabled,
    'expected_owner_read_policy_count',
      compatibility.expected_owner_read_policy_count,
    'matches_migration_013_structure',
      compatibility.matches_migration_013_structure
  ) AS determination_evidence
FROM compatibility;

ROLLBACK;
