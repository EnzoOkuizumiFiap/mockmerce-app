/**
 * Configuração dinâmica do Expo.
 * Carrega a configuração estática de app.json e injeta com segurança
 * as chaves que estão no .env ou dentro do google-services.json (ambos no .gitignore),
 * evitando expor chaves públicas ou de API hardcoded no repositório Git.
 */
module.exports = ({ config }) => {
  let googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!googleMapsApiKey) {
    try {
      const googleServices = require('./google-services.json');
      googleMapsApiKey = googleServices?.client?.[0]?.api_key?.[0]?.current_key;
    } catch {
      // google-services.json pode não existir em ambientes de CI ou outros setups
    }
  }

  return {
    ...config,
    android: {
      ...config.android,
      config: {
        ...config.android?.config,
        googleMaps: {
          apiKey: googleMapsApiKey,
        },
      },
    },
  };
};
