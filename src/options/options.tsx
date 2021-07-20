import * as React from 'react'
import * as ReactDOM from 'react-dom'
import {FormControlLabel, Switch} from "@material-ui/core";

import './options.css'


const App: React.FC<{}> = () => {

    return (
        <>
            <h1>Autofill</h1>
            <FormControlLabel
                control={
                    <Switch
                        name="checkedB"
                        color="primary"
                    />
                }
                label="Auto fill in the username and password"
            />
        </>
    )
}


const root = document.createElement('div')
document.body.appendChild(root)
ReactDOM.render(<App/>, root)
