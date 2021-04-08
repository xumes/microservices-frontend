import { CssBaseline, MuiThemeProvider } from '@material-ui/core';
import { SnackbarProvider } from 'notistack';
import React from 'react';
import { Mapping } from './components/Mapping';
import theme from './theme';

function App() {
  return (
    <MuiThemeProvider theme={theme}>
      <SnackbarProvider maxSnack={3}>
        <CssBaseline>
          <Mapping />
        </CssBaseline>
      </SnackbarProvider>
    </MuiThemeProvider>
  );
}

export default App;
