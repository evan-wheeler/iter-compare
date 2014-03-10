var Q = require( 'q' );

var iter_compare = module.exports = function( iter1, iter2, cmpFn ) { 

    var resultList = [],
        d = Q.defer(); 

    function nextCompare( iterLeft, iterRight, val1, val2 ) { 
        if( val1 && val2 ) {
            var cmp = cmpFn( val1, val2 );
             
            if( cmp === 0 ) { 
                resultList.push( { value: val1, exists: "both" } );
                // advance both
                stepBoth( iterLeft, iterRight );
            }
            else if( cmp < 0 ) { 
                resultList.push( { value: val1, exists: "left" } );
                stepLeft( iterLeft, iterRight, val2 );
            }
            else { /*if( cmp > 0 ) */
                resultList.push( { value: val2, exists: "right" } );
                stepRight( iterLeft, iterRight, val1 );
            }
        }
        else { 
            // we have reached the end of one list... iterate only the other list.            
            if( val1 ) { 
                resultList.push( { value: val1, exists: "left" } );
                stepLeft( iterLeft, iterRight, val2 );
            }
            else if( val2 ) { 
                resultList.push( { value: val2, exists: "right" } );
                stepRight( iterLeft, iterRight, val1 );
            }
            else { 
                // both are at the end.
                d.resolve( resultList );
            }
        }
    }
        
    function stepLeft(iterLeft, iterRight, rightVal) {
        iterLeft().then( function( v ) { 
            nextCompare( iterLeft, iterRight, v, rightVal );
        } );
    }

    function stepRight(iterLeft, iterRight, leftVal) {
        iterRight().then( function( v ) { 
            nextCompare( iterLeft, iterRight, leftVal, v );
        } );
    }

    function stepBoth( iterLeft, iterRight ) { 
        Q.all( [ iterLeft(), iterRight() ] ).then( function( results ) { 
            nextCompare( iterLeft, iterRight, results[0], results[1] );
        }, function( err ) { 
            d.fail( err );
        } );
    }
    
    // start off by getting both iterators.
    stepBoth( iter1, iter2 );
    
    return d.promise;
}

