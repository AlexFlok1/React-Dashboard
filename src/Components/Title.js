import { Grid } from '@material-ui/core';
const Title_c = ( props ) => {

    return (
        <>
            <Grid item xs={ props.size } style={ { height:'3vh', padding:'0px 10px'} }>
                <h5 style={ { textAlign:'left' } }>{ props.text }</h5>
            </Grid>
        </>
    )
}

export default Title_c