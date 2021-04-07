import { CssBaseline, MuiThemeProvider } from '@material-ui/core';
import React from 'react';
import { Mapping } from './components/Mapping';
import theme from './theme';

function App() {
  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline>
        <Mapping />
      </CssBaseline>
    </MuiThemeProvider>
  );
}

export default App;
