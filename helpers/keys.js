'use strict';

// keys follow this convention:
// <key group, e.g. 'user'><suffix>
// snake_case MUST be 100% lower case
// Field names are generally <noun><adjective><unit>
//    E.g. ‘rain_peak_rate_in_sf_min’ is 
//        Rain: what we are measuring
//        Peak rate: aspect of rain we are measuring, i.e. highest rate of rainfall
//        Inches/sf/minute: unit of measurement
// always use units (lbs, sf, cf, gals, in)
// do not use pfc = use lbs_cf
// sheet = sheet flow runoff
// trans = transient runoff
// wt = weight, generically (use in conjunction with units, e.g. lbs)
// rain = rainfall (same as 'applied'); do not use 'rainfall'
// astm means per appropriate astm test: e.g. e-2397 or e-2399
// dry means oven dry for media and from-the-factory dry for dry goods
// max means maximum saturated weight
// media means only the media, profile means the entire assembled profile
// dispensed means what comes out of the nozzles
// applied means what lands on the cassette
// retention is water held in the profile, absolute vs dry weight
// absorbed is used as a subset of retention: water retained DURING the test, relative to initial weight
// for consistency do not use other forms of the word 'retention' and 'absorbed'
// pct = percent; percent OF WHAT must be clear in definitions or actual key - NO AMBIGUOUS PERCENTS!
// amc = antecedent moisture condition
// vwc = volumetric water capacity
// amc and vwc are calculated the same (percentage: volume of water retained / max volume of water retained per astm)
// amc and vwc are calculaed at DIFFERENT TIMES: amc at the beginning of the increment, and vwc at the end
// all calculations are taken at the end of the increment, except:
//    amc, or anything specifically marked as 'prior' (currently nothing)
// _tot, _Tot, _Avg, _avg, _min, _Min are from Campbell and have no flexibility (i.e. we cannot do 'true' camelCase in those cases)
// _total is a running total calculation (not from datalogger)
// any measurements without a suffix of _total are 'this increment'

const keys = {
  // common keys are the ONLY keys that should be shared among key sets; all others should be unique.
  // we prefix common keys in SQL statements to differentiate tables
  commonSc: [
    'id',
    'timestamp_created', 
    'notes',
    'locked',
  ],

  // @@@@@@@@@@ USERS @@@@@@@@@@
  users: [
  //snake all             cC all              2POST   3POST req. 4PUT  5STRING 6TRIM 7SIZES 8NAME 9DEFINITIONS
    ['id'               ,'id'                ,false,  false,    false, false,  false, false,'user id'          ,'unique id'],
    ['timestamp_created','timestampCreated'  ,false,  false,    false, false,  false, false,'timestamp created','date and time of record creation'],
    
    ['username'         ,'username'          ,true ,  true ,    true , true ,  true , {min: 1 },'username'     ,'username'], 
    ['password'         ,'password'          ,true ,  true ,    true , true ,  true , {min: 8, max: 72 },'password','hashed password'],    
    ['first_name'       ,'firstName'         ,true ,  true ,    true , true ,  false, false,'first name'       ,'user\'s first name'], 
    ['last_name'        ,'lastName'          ,true ,  true ,    true , true ,  false, false,'last name'        ,'user\'s last name'], 
    ['email'            ,'email'             ,true ,  true ,    true , true ,  false, false,'user\'s email'    ,'user\'s email is only used for password recovery'], 
    ['pw_reset'         ,'pwReset'           ,false,  false,    true , true ,  false, false,'password reset'   ,'true if user must reset password'], 
    ['permissions'      ,'permissions'       ,true ,  true ,    true , false,  false, false,'permissions'      ,'user\'s permissions, including which server endpoints are authorized'], 
  ],

  tableName: [
  ],

};

module.exports = { keys };