import AppRoutes from './routes/AppRoutes';
import { DocumentProvider } from './context/DocumentContext';

function App() {
  return (
    <DocumentProvider>
      <AppRoutes />
    </DocumentProvider>
  );
}

export default App;
