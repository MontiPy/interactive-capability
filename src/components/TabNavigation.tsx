import { Tabs, Tab, Badge, useTheme, useMediaQuery } from '@mui/material';
import { useApp } from '../context/AppContext';

export default function TabNavigation() {
  const { state, dispatch } = useApp();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleTabChange = (_: React.SyntheticEvent, newTab: 'single' | 'comparison') => {
    dispatch({ type: 'SET_ACTIVE_TAB', payload: newTab });
  };

  return (
    <Tabs
      value={state.activeTab}
      onChange={handleTabChange}
      variant={isMobile ? 'scrollable' : 'standard'}
      scrollButtons="auto"
      aria-label="Distribution analysis tabs"
    >
      <Tab label="Single Distribution" value="single" aria-label="Single distribution analysis" />
      <Tab
        label={
          state.scenarios.length > 0 ? (
            <Badge badgeContent={state.scenarios.length} color="primary">
              <span style={{ paddingRight: state.scenarios.length > 0 ? '16px' : '0' }}>
                Scenario Comparison
              </span>
            </Badge>
          ) : (
            'Scenario Comparison'
          )
        }
        value="comparison"
        aria-label={`Scenario comparison with ${state.scenarios.length} scenarios`}
      />
    </Tabs>
  );
}
