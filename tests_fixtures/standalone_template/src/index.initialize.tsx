import { createRoot } from 'react-dom/client';

import { MainApp } from './app';

// create a new instance of the app
createRoot(document.getElementById('main')!).render(<MainApp />);
