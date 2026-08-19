import GoogleIntegrationWorkspace from "./GoogleIntegrationWorkspace.jsx";import GoogleReadValidationPanel from "./GoogleReadValidationPanel.jsx";
export default function IntegrationActivationWorkspace({client,session}){return <><GoogleIntegrationWorkspace client={client} session={session}/><GoogleReadValidationPanel client={client} session={session}/></>}
