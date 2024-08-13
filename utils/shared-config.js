module.exports = {
  setConfig: (configName, configValue) => {
    this[configName] = configValue;
  },
  getConfig: (configName) => this[configName],
};
