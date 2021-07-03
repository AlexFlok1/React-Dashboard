import './App.css';
import { BrowserRouter as Router, Switch, Route} from 'react-router-dom'
//Views
import Dashboard from './Views/Dashboard'

function App() {
  return (
    <div className="App">
        <Router basename='/cle-web/rubbermold-score/'>
            <Switch>
                <Route exact path='/'>
                    <Dashboard />
                </Route>
            </Switch>
        </Router>
    </div>
  );
}

export default App;
