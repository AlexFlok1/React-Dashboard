import { useEffect, useState } from 'react'
import { Bar } from 'react-chartjs-2'

const Chart_c = ( props ) => {

    return (
        <>
            { props.data && <Bar options={ props.settings } data={ props.data } /> }
        </>
    )

}

export default Chart_c