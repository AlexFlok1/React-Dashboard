import { useState } from 'react'
import { Button} from '@material-ui/core';

const Filters_c = ( props ) => {

    const [ filters_arr ] = useState( props.filters )

    return (
        <div style={ {display:'flex', height:'100%', justifyContent:'center', alignItems:'center', flexDirection:'column'} }>
             {
                 filters_arr.map( ( filter, index ) => (
                    <Button key={ index } elevation={1} variant="contained" color="primary" className='af-filter_btn' onClick={ ()=> { 
                        props.fn_update( props.filter_type , filter.start, filter.end, filter.name ) } 
                        }>
                        { filter.name }
                    </Button>
                 ) )
             }
        </div>
    )

}

export default Filters_c