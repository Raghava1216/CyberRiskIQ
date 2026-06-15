import SettingsForm from "src/components/forms/reactformutils/FormRuntimeEngine";

const Settings = () => {
  return (
    <>
      <SettingsForm formService="cyberrisk_settings" objectId={-1} />
    </>
  );
};

export default Settings;
