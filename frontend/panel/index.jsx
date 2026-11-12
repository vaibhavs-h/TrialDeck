import React, { useEffect, useState } from 'react';
import ForgeReconciler, { Text } from '@forge/react';
import { invoke } from '@forge/bridge';

// UI Kit issue panel. Week 1: hello-world proving the panel -> resolver loop works.
// Week 2: category lozenge, protocol version, similar deviations, Draft report button, CAPA status.
const App = () => {
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    invoke('ping')
      .then((r) => setMessage(r.message))
      .catch((e) => setError(String(e)));
  }, []);

  if (error) return <Text>Something went wrong: {error}</Text>;
  if (!message) return <Text>Loading...</Text>;
  return <Text>{message}</Text>;
};

ForgeReconciler.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
