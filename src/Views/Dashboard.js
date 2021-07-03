import '../ViewStyles/Dashboard.css';
import { Grid, Paper, Divider } from '@material-ui/core';
import { Line } from 'react-chartjs-2'
import Chart_c from '../Components/chart'
import Filter_c from '../Components/Filters'
import Title_c from '../Components/Title'
import { useEffect, useLayoutEffect, useState } from 'react';
import moment from 'moment'


class API{
    #api_URL='url'
    #body

    constructor( query_str ){
        this.#body = query_str;
    }

    send_Request = async () => {
        return await fetch( this.#api_URL,{
            method:'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify( {
            query: this.#body
            } )
        }).then( res => res.json() )
    }
}

class buildSection {

    #URL = 'url'

    constructor(){}

    apiCall = async( query_str ) => {

        let result = await fetch( this.#URL,{
            method:'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify( {
            query: query_str
            } )
        }).then( res => res.json() )

        return result;
    }

}

class buildChart {

    #type
    #options
    #dataset

    constructor ( chart_type, chart_options, chart_data ){
        this.#type = chart_type;
        this.#options = chart_options;
        this.#dataset = chart_data;
    }

    get options () {
        return {
            maintainAspectRatio : false,
            elements:this.#options.elements,
            scales:{ yAxes:( this.#options.yAxis ) ? this.#options.yAxis: [], xAxes:( this.#options.xAxis ) ? this.#options.xAxis: [] }
        }
    }

    get dataset () {

       let transforemd_dataset = new Array( this.#dataset.lbl_color.length ).fill( 0 ).map( ( el, index ) => {

            return {
                stack: ( this.#type.indexOf( 'stack' ) !== -1 ) ? 'stack1': '',
                label: this.#dataset.lbl_color[ index ].lbl,
                data: this.#dataset.data.map( el => parseFloat( el['col' + ( index + 1 ) ] ) ),
                backgroundColor: this.#dataset.lbl_color[ index ].color
            }

       } );

       return transforemd_dataset;

    }

}

let Dashboard = () => {

    const [ Sanuys, setSanyus ] = useState( null );
    const [ ch_data, setChData] = useState( null );
    const [ labor_data, setLaborData ] = useState( null );
    const [ labor_data_chart, setLaborDataChart ] = useState( null );
    const [ market_health, setMarketHealth ] = useState( null );
    const [ market_health_chart, setMarketHealthChart ] = useState( null );
    const [ productionChart, setProductionChart ] = useState( null );
    const [ overallScore, setOverallScore ] = useState( 0 );
    const [ scoreChart, setScoreChart ] = useState( null );
    const [ loading, setLoading ] = useState( 'true' );

    let update_chart = async ( chart_type, s_date, e_date, filter ) => {
        console.log( chart_type );
        console.log( s_date )
        switch( chart_type ) {
            case 'san_score':
                let res1 = await setup_san_chart( s_date, e_date, filter );
                console.log(res1);
                setChData( res1 ); 
                break;
            case 'labor':
                let res2 = await setup_labor_chart( s_date, e_date );
                setLaborDataChart( res2 );
                break;
            case 'production':
                let res4 = await setup_ProductionChart( s_date, e_date )
                setProductionChart( res4 )
                break;
            case 'm_health':
                let res3 = await setup_marketHealthChart( s_date, e_date );
                setMarketHealthChart( res3 );
                setMarketHealth(Math.round( res3.data.datasets[0].data[res3.data.datasets[0].data.length-1] ))
                break;
        }
    }

    useEffect( () => {

        let arr = [ { name: 'test1', val:1 }, { name: 'test2', val:2 }, { name: 'test3', val:3 }, { name: 'test1', val:1 } ]

        console.log( arr.reduce( ( prev, cur, cur_indx, arr ) => {

            let duplicate = []

            if( cur_indx === 1 )
                prev = [ { ...prev } ]
            
            prev.map( ( el, index )  => {
                if(el.name === cur.name){
                   duplicate.push( index )
                }
            } )
            if( duplicate.length > 0 )
               prev[ duplicate[0] ].val = cur.val + prev[ duplicate[0] ].val
            else
                prev.push( cur )
            
           return prev
        } ))

        console.log('After updated the dom')

        let async_Effect = async () => {

            setLoading('true');
           
            setMarketHealth(0);
    
            let res1 = await setup_san_chart( moment().format( 'M/DD/yyyy' ),  moment().format( 'M/DD/yyyy' ), 'today' );
            let res2 = await setup_labor_chart( moment().add(-14,'days').format('M/DD/yyyy').toString(), moment().format('M/DD/yyyy').toString() );
            let res3 = await setup_marketHealthChart( 7, moment().format('M/DD/yyyy').toString() );
            let res4 = await setup_ProductionChart(  moment().add(-14,'days').format('M/DD/yyyy').toString(), moment().format('M/DD/yyyy').toString() )
            let res5 = await setup_FinalScore( res4, res1, res2 ,res3 );
            let res6 = await setup_scoreChart(); 
    
            console.log(res6)
            setChData( res1 ); 
            setSanyus( res1.sanyus );
            setLaborDataChart( res2 );
            setLaborData( res2.labor_data )
            setMarketHealthChart( res3 );
            setMarketHealth(Math.round( res3.data.datasets[0].data[res3.data.datasets[0].data.length-1] ));
            setProductionChart( res4 );
            setOverallScore( res5 );
            setScoreChart( res6 )

    
            setLoading( 'false' )
        }

        async_Effect();

       // return () =>{ console.log('Clean Up') }

    }, [] ) 

    //this method will init chart options and data
    const setup_san_chart = async ( s_date, e_date, filter ) => {

        let query_arr = ``

        for ( let i = 0; i < 8; i++){
            query_arr += ` San` + (i + 1) +`:vorne_raw(machine:"Sanyu 0` + (i + 1) +`"){
                captureTime,
                deviceKey,
                duration,
                reason_text,
                state_text,
                part_id
              }`
        }

        let query_str = `query{` + query_arr + `}`

        let api = new API( query_str )
        let san_arr = await api.send_Request();

        let sans = [
            { name:'San1', device:'Sanyu 01', Molds: ['6" SBR'], Tonnage: 450, Current_Mold: san_arr.data.San1[0].part_id, state: san_arr.data.San1[0].state_text },
            { name:'San2', device:'Sanyu 02', Molds: ['6" EPDM', '6" SBR', '8" SBR', '6" EPDM', '5.25" Main', '4.5" Main'], Tonnage: 450, Current_Mold: san_arr.data.San2[0].part_id, state: san_arr.data.San2[0].state_text },
            { name:'San3', device:'Sanyu 03', Molds: ['16" EPDM', '16" SBR', '14" SBR', '14" EPDM', '5.25" Main', '4.5" Main' ], Tonnage: 450, Current_Mold: san_arr.data.San3[0].part_id, state: san_arr.data.San3[0].state_text },
            { name:'San4', device:'Sanyu 04', Molds: [ '10" SBR', '10" EPDM' ], Tonnage: 450, Current_Mold: san_arr.data.San4[0].part_id, state: san_arr.data.San4[0].state_text },
            { name:'San5', device:'Sanyu 05', Molds: ['12" SBR'], Tonnage: 300, Current_Mold: san_arr.data.San5[0].part_id, state: san_arr.data.San5[0].state_text },
            { name:'San6', device:'Sanyu 06', Molds: ['12" SBR', '12" EPDM' ], Tonnage: 300, Current_Mold: san_arr.data.San6[0].part_id, state: san_arr.data.San6[0].state_text },
            { name:'San7', device:'Sanyu 07', Molds: ['8" SBR'], Tonnage: 450, Current_Mold: san_arr.data.San7[0].part_id, state: san_arr.data.San7[0].state_text },
            { name:'San8', device:'Sanyu 08', Molds: [ '2" SBR', '3" SBR', '4" SBR', '2" EPDM', '3" EPDM', '4" EPDM' ], Tonnage: 300, Current_Mold: san_arr.data.San8[0].part_id, state: san_arr.data.San8[0].state_text }
        ] 

        let query_str2 = `query{ san_score(s_date:"` + s_date + `", e_date:"` + e_date + `"){ date, dh, Good }}`

        let api2 = new API( query_str2 )
        let san_arr_chart = await api2.send_Request();
        // based on filter 
        let san_score_per_day  = [];

        if( filter !== 'today' ){
            san_arr_chart.data.san_score = san_arr_chart.data.san_score.map( el => ({ ...el, date:moment( el.date ).format('M/DD/yyyy') }) )
            san_arr_chart.data.san_score.reduce( (accumulator, currentValue, index, data ) => {
                
                if( accumulator.date !== currentValue.date ){
                    san_score_per_day.push( { ...accumulator, Good: (accumulator.Good/24 ).toFixed( 1 ), Bad: 8 - (accumulator.Good/24 ).toFixed( 1 )  } );
                    accumulator = currentValue;
                }

                accumulator.Good += currentValue.Good
                return accumulator
               
            })

            san_arr_chart.data.san_score = san_score_per_day

        }
        san_arr_chart.data.san_score = san_arr_chart.data.san_score.map( el => (
            { ...el, 
                date:moment( el.date ).format('M/DD/yyyy'),
                col1: el.Good, 
                col2: 8 - el.Good }
            ) )

        let data_lbl_color = [ 
            {
                lbl:'# San working right',
                color:'rgb(54, 162, 235)',
                type:'bar'
            },
            {
                lbl:'# San not working right',
                color:'#cccccc',
                type:'bar'
            }
        ] 
        let chart1 = new buildChart( 'stack', { yAxis:[ { stacked: true } ], xAxis:[ { stacked: true } ] }, { data: san_arr_chart.data.san_score, lbl_color: data_lbl_color } );

        let c_labels = ( filter === 'today' ) ? ( [...san_arr_chart.data.san_score.map( el => el.dh ) ]) : ( [...san_score_per_day.map( el => el.date )] );
      
        const data1 = {
            labels: c_labels,
            datasets: chart1.dataset,
        };


        console.log( data1 )
        console.log( chart1.dataset)

        return { options: chart1.options, data: data1, sanyus: sans };

    }

    const setup_labor_chart = async ( s_date, e_date ) => {

        //init chart builder

        let chart2 = new buildChart( 'bar', {}, {} )

        //init data object
        const data1 = {
            labels: [],
            datasets: [
              {
                label: 'Shift 1',
                data: [],
                backgroundColor: 'rgb(54, 162, 235)',
              },
              {
                label: 'Shift 2',
                data: [],
                backgroundColor: '#f5c842',
              },
              {
                label: 'Shift 3',
                data: [],
                backgroundColor: '#68cc81',
              }
            ],
          };

        let labor_data_ch = await fetch('url/api/Rubbermold/hoursofwork_2?s_date=' + s_date + '&e_date=' + e_date);
        labor_data_ch = await labor_data_ch.json();
        data1.labels = labor_data_ch['$values'].map( el => moment(el.date).format('MMM D') ).filter( ( val, index, self ) => self.indexOf( val ) === index );
        data1.labels.forEach( ( lbl, index ) => {
            let buf = labor_data_ch['$values'].filter( el => moment(el.date).format('MMM D').toString() === lbl );
            //console.log( buf);
            for( let i = 0; i < 3; i++ ){
                let operators_count = 0
                buf.forEach( el => {
                    if( parseInt(el.Shift) === ( i + 1 ) ){
                        operators_count = el.Operator
                    }
                })
                data1.datasets[ i ].data.push(operators_count)
            }
        } )

        let labor_arr = [
            { shift: 1, total_people:  data1.datasets[ 0 ].data[ data1.datasets[ 0 ].data.length -1 ] },
            { shift: 2, total_people:  data1.datasets[ 1 ].data[ data1.datasets[ 1 ].data.length -1 ] },
            { shift: 3, total_people:  data1.datasets[ 2 ].data[ data1.datasets[ 2 ].data.length -1 ] }
        ]
        
        return { options: chart2.options, data: data1, labor_data: labor_arr } ;

    }

    const setup_marketHealthChart = async ( s_date, e_date ) => {
        console.log(s_date)
        //init chart
        let chart3 = new buildChart( 'line', { 
            yAxis:[ 
                { 
                    ticks:{ 
                        beginAtZero: true 
                    }
                 } 
                ] 
            }, {} )

        let query_str_arr = ``;

        for ( let i = 0; i < s_date; i++ ){
            query_str_arr += `dat` + ( i + 1 ) + `:market_health2(e_date:"` + moment(e_date).add( -(s_date-i), 'days' ).format('M/DD/yyyy').toString() + `"){ Units }`
        }

        let query_str = `query{` + query_str_arr + `}`;

        let api = new API( query_str )
        let result = await api.send_Request ();

        console.log( result )
        const data1 = {
            labels: [],
            datasets: [
              {
                label: 'Market Health',
                data: [],
                fill: false,
                backgroundColor: 'black',
                borderColor: '#4c94b5',
              },
            ],
          };

          for ( let i = 0; i < s_date; i++ ){
            data1.labels.push(  moment(e_date).add( -(s_date-i), 'days' ).format('MMM D').toString() );
            data1.datasets[0].data.push( result.data['dat' + (i+1) ][0].Units/21423 * 100 );
          }
          
          return { options: chart3.options, data: data1 };
    }

    const setup_ProductionChart = async ( s_date, e_date ) => {

                //init chart
                let chart4 = new buildChart( 'line', { elements: { point:{ radius: 0 } } } )

                let query_str = `query{
                    allddata_search( s_date:"` + s_date + `", e_date:"` + e_date + `", machine:"CLE SAN" ){
                      date,
                      Good
                    }
                  }`
                
                let api = new API( query_str )
                let result = await api.send_Request();

                //init data object
                const data1 = {
                    labels: [ ...result.data.allddata_search.map( el => moment( el.date ).add(1,'day').format('MMM D') ) ],
                    datasets: [
                        {
                            type:'line',
                            label: 'Target',
                            data: [ ...new Array( result.data.allddata_search.length ).fill( 2200 ) ],
                            borderColor: '#32bf74',
                            backgroundColor:'transparent',
                            borderDash:[5,5]
                        },
                        {
                            type:'bar',
                            label: 'Units',
                            data: [ ...result.data.allddata_search.map( el => el.Good ) ],
                            backgroundColor: 'rgb(54, 162, 235)',
                        }
                    ],
                  };
        return { options: chart4.options, data: data1 }
    }

    const setup_FinalScore = async ( production, sans, labor, health ) => {

        let San_Score = 0, LaborScore = 0, HealthScore = 0, UnitsScore = 0;
        sans.sanyus.forEach( san => {
            San_Score += ( san.Molds.indexOf( san.Current_Mold ) !== -1 && san.state !== 'down_enum' ) ? 1 : 0;  
        } )

        San_Score = (San_Score/8).toFixed(1);
        HealthScore = (health.data.datasets[0].data[ health.data.datasets[0].data.length - 1 ]/100).toFixed(1);
        UnitsScore = (production.data.datasets[1].data[ production.data.datasets[1].data.length - 1 ]/2200).toFixed(1);
        
        LaborScore = labor.data.datasets.map( el=> el.data[ el.data.length - 1 ]).reduce(( accumulator, value ) => ( accumulator + value ))/21

        let final_result =  parseFloat(San_Score) + parseFloat(LaborScore) + parseFloat(HealthScore) + parseFloat(UnitsScore)
        let query = `mutation{
            spcEntry(data:[{partno:"CLE Rubbermold San Score", datetime:"` + moment().format('M/DD/yyyy').toString() + `",data:[` + parseFloat( final_result ) + `], plant:"CLE"}])
        }`
        if( moment().format('HH') == '23' ){
                let query = `mutation{
                    spcEntry(data:[{partno:"CLE Rubbermold San Score", datetime:"` + moment().format('M/DD/yyyy').toString() + `",data:[` + parseFloat( final_result ) + `], plant:"CLE"}])
                }`
                let api = new API( query )
                await api.send_Request();
        }

        return (final_result.toFixed(1))

    }

    const setup_scoreChart = async () => {
        
        let api = new API( `query{ score_chart{ date, val } }` )
        let result = await api.send_Request();
        
         //increment for backets
        let increment = -.25
        let histogram_chart_data = new Array( 16 ).fill(0);
        let lbl = new Array(16).fill(0).map( _ => { increment += .25; return increment + '-' + ( increment + .25 ) } ) 

        result.data.score_chart.forEach( el => {
               lbl.forEach( ( backet, index ) => {
                   let limits = backet.split( '-' );
                   if( el.val >= limits[0] && el.val < limits[1] )
                        histogram_chart_data[ index ] += 1;
               } )
        } )

        const data1 = {
            labels: lbl,
            datasets: [
                {
                    type:'bar',
                    label: '',
                    data: [ ...histogram_chart_data ],
                    backgroundColor: 'rgb(54, 162, 235)',
                }
            ],
          };

        let options1={
            maintainAspectRatio : false,
            legend:{ display: false },
            scales:{ yAxis:[], xAxis: [ {
                categoryPercentage: 1.0,
                barPercentage: 1.0
            }
        ] }
        }

        return { data: data1, options: options1 }

    }

    return (
        <div id='DASHBOARD-VIEW'>
            <Grid container style={ {
                width:'100%',
                height:'100vh'  
            } }>
                <Grid item xs={12}  style={ { height:'5vh'} }>
                    <Paper elevation={3} style={{ padding:'5px 10px', height:'100%', borderRadius:'0px', textAlign:'center',alignItems:'center',justifyContent:'center' } }>
                        Sanyu Dashboard
                    </Paper>
                </Grid>

                <Grid item xs={12} style={ { height:'3vh', padding:'0px 10px'} }>
                    <h5 style={ { textAlign:'left' } }>Overall Score</h5>
                </Grid>
                <Grid item xs={12}  style={ { height:'20vh'} }>
                    <Grid container style={ { width:'100%', height:'100%', padding:'5px 10px' } }>
                        <Grid item lg={6} xs={12} style={ { width:'100%', height:'100%' } } >
                            
                            <Grid justify='center' alignItems='center' container style={ { width:'100%', height:'100%' } }>

                               <Grid item lg={3} xs={6}>
                                   <Paper style={{ width:'100%', height:'13vh', display:'flex',alignItems:'center', justifyContent:'center', flexDirection:'column' }} elevation={1}>
                                        <b>Current Score</b>
                                        <p>{overallScore}/4</p>
                                   </Paper>
                               </Grid>

                            </Grid>
                                
                        </Grid>
                                
                        <Grid item lg={6} xs={12} style={ { width:'100%', height:'100%', padding: '12px 10px' } }>
                        {
                            scoreChart && <Chart_c data={ scoreChart.data } settings={ scoreChart.options }/>
                        }
                        </Grid>
                        
                    </Grid>
                    <Divider />
                </Grid>

                <Title_c  size={12} text="# Machines running playbook vs. Machines required per playbook" />

                <Grid item xs={12}  style={ { height:'27vh'} }>
                    <Grid container style={ { width:'100%', height:'100%', padding:'5px 10px' } }>
                        <Grid item lg={6} xs={12} style={ { width:'100%', height:'100%' } } >
                            
                            <Grid container style={ { width:'100%', height:'100%' } }>

                                {
                                    Sanuys &&  
                                        Sanuys.map( san => 
                                            (
                                                <Grid key={ san.device } item lg={3} xs={6} style={ { height:'50%', padding: '12px 10px' } }>
                                                    <Paper elevation={1} className='san-card' 
                                                    style={ { 
                                                        background: ( ( san.Molds.indexOf( san.Current_Mold ) !== -1 && san.state !== 'down_enum' ) 
                                                        ? 'rgb(64, 207, 138)' 
                                                        : 'rgba(255,0,0,.7)' )  
                                                        } } >
                                                            <h3 style={ { margin:'0', display: (san.state !== 'down_enum') ? 'none' : 'block' } }>Machine Down</h3>
                                                            <b style={ { margin:'0' } }>{ san.name }</b>
                                                            <small>{ san.Current_Mold}</small>
                                                    </Paper>
                                                </Grid>
                                            )
                                         )
                                     
                                }

                            </Grid>
                                
                        </Grid>
                                
                        <Grid item lg={5} xs={12} style={ { width:'100%', height:'100%', padding: '12px 10px' } }>
                                {
                                   ch_data && <Chart_c data={ ch_data.data } settings={ ch_data.options }/>
                                }
                        </Grid>
                        <Grid item lg={1} xs={12} style={ { width:'100%', height:'100%', padding: '12px 10px' } }>
                                {
                                    <Filter_c filters={[
                                        {
                                            name:'Today',
                                            start:moment().format( 'M/DD/yyyy' ),
                                            end:moment().format( 'M/DD/yyyy' )
                                        },
                                        {
                                            name:'2 Weeks',
                                            start:moment().add( -14, 'days' ).format( 'M/DD/yyyy' ),
                                            end:moment().format( 'M/DD/yyyy' )
                                        },
                                        {
                                            name:'1 Month',
                                            start:moment().add( -30, 'days' ).format( 'M/DD/yyyy' ),
                                            end:moment().format( 'M/DD/yyyy' )
                                        }
                                    ]} filter_type="san_score" fn_update={ update_chart } />
                                }
                        </Grid>
                    </Grid>
                    <Divider />
                </Grid>

                <Title_c  size={12} text="Available People vs. Required People" />

                <Grid item xs={12}  style={ { height:'22vh'} }>
                    <Grid container style={ { width:'100%', height:'100%', padding:'5px 10px' } }>

                        <Grid item xs={6} >
                            <Grid container style={ { width:'100%', height:'100%', padding:'5px 10px', display:'flex', justifyContent:'center', alignItems:'center' } }>
                                   {
                                       labor_data && labor_data.map( sh => (
                                        <Grid key={sh.shift} item xs={4} style={ { padding:'10px', height:'60%' } }>
                                            <Paper elevation={1} className='san-card'>
                                                <b>Shift: { sh.shift }</b>
                                                <p>{ sh.total_people }/7</p>
                                            </Paper>
                                        </Grid>
                                       ) )
                                   }
                            </Grid>
                        </Grid>
                        <Grid item xs={5} style={ { width:'100%', height:'100%', padding: '12px 10px' } }>
                                {
                                    labor_data_chart && <Chart_c data={ labor_data_chart.data } settings={labor_data_chart.options }/>
                                }
                        </Grid>
                        <Grid item xs={1} style={ { width:'100%', height:'100%', padding: '12px 10px' } }>
                                {
                                    <Filter_c filters={[
                                        {
                                            name:'2 Weeks',
                                            start:moment().add( -14, 'days' ).format( 'M/DD/yyyy' ),
                                            end:moment().format( 'M/DD/yyyy' )
                                        },
                                        {
                                            name:'1 Month',
                                            start:moment().add( -30, 'days' ).format( 'M/DD/yyyy' ),
                                            end:moment().format( 'M/DD/yyyy' )
                                        }
                                    ]} filter_type="labor" fn_update={ update_chart } />
                                }
                        </Grid>

                    </Grid>
                    <Divider />
                </Grid>

                <Title_c  size={7} text="Market Health" />

                <Title_c  size={5} text="# units made vs. # units planned per playbook" />

                <Grid item xs={12}  style={ { height:'25vh'} }>
                    <Grid container style={ { width:'100%', height:'100%', padding:'5px 10px' } }>

                        <Grid item xs={1} >
                            <Grid container style={ { width:'100%', height:'100%', padding:'5px 10px', display:'flex', justifyContent:'center', alignItems:'center' } }>
                                {
                                    market_health && 
                                    <Paper elevation={1} style={ { width:'80%', height:'30%', padding:'5px 10px', display:'flex', justifyContent:'center', alignItems:'center', flexDirection:'column' } }>
                                        <b>Prior Day</b>
                                        <p>{ market_health }%</p>
                                    </Paper>
                                }
                            </Grid>
                        </Grid>
                        <Grid item xs={4} style={ { width:'100%', height:'100%', padding: '12px 10px' } }>
                                {
                                    market_health_chart && <Line data={market_health_chart.data} options={market_health_chart.options} />
                                }
                        </Grid>
                        <Grid item xs={1} style={ { width:'100%', height:'100%', padding: '12px 10px' } }>
                                {
                                    <Filter_c filters={[
                                        {
                                            name:'2 Weeks',
                                            start:14,
                                            end:moment().format( 'M/DD/yyyy' )
                                        },
                                        {
                                            name:'1 Month',
                                            start:30,
                                            end:moment().format( 'M/DD/yyyy' )
                                        }
                                    ]} filter_type="m_health" fn_update={ update_chart } />
                                }
                        </Grid>
                        <Grid item xs={1} style={ { width:'100%', height:'100%', justifyContent:'center' } }>
                                <div style={ { display:'inline-block', height:'95%', width:'1px', background:'grey' } } ></div>
                        </Grid>
                        <Grid item xs={4}>
                                {
                                    productionChart && <Chart_c data={ productionChart.data } settings={ productionChart.options }/>
                                }
                        </Grid>
                        <Grid item xs={1} style={ { width:'100%', height:'100%', padding: '12px 10px' } }>
                                {
                                    <Filter_c filters={[
                                        {
                                            name:'2 Weeks',
                                            start:moment().add( -14, 'days' ).format( 'M/DD/yyyy' ),
                                            end:moment().format( 'M/DD/yyyy' )
                                        },
                                        {
                                            name:'1 Month',
                                            start:moment().add( -30, 'days' ).format( 'M/DD/yyyy' ),
                                            end:moment().format( 'M/DD/yyyy' )
                                        }
                                    ]} filter_type="production" fn_update={ update_chart } />
                                }
                        </Grid>
                    </Grid>
                    <Divider />
                </Grid>
                <Grid item xs={12}  style={ { height:'5vh'} }>

                </Grid>
            </Grid>
            <div id="PRELOADER" style={ { display:( loading == 'true' ) ? 'block' : 'none' } }>
                <Grid container style={ { width:'100%',height:'100%'} } justify="center">
                    <Grid item xs={3} style={ { display:'flex', alignItems:'center', justifyContent:'center'} }>
                        <Paper elevation={1} style={ { width:'100%', height:'3vh', display:'flex', alignItems:'center', justifyContent:'center'} }>
                            <b>Loading...</b>
                        </Paper>
                    </Grid>
                </Grid>
            </div>
        </div>
    )
}

export default Dashboard