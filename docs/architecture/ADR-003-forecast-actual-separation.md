# ADR-003: Forecast and Actual Separation

Decision: forecasts live on campaigns. Actual values live only in `revenue_records` after verified evidence. Integer minor units and ISO currency are mandatory. A value-type label alone is insufficient.
