import { Workspace } from './components/Workspace';
import { ThemeProvider } from './components/ThemeProvider';

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="k8s-theme">
      <Workspace />
    </ThemeProvider>
  );
}

export default App;
