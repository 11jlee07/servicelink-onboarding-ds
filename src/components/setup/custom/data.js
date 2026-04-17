/* ─── Product catalog ─────────────────────────────────────────────── */
export const PRODUCT_GROUPS = [
  {
    id: 'conventional',
    label: 'Conventional (Fannie Mae / Freddie Mac)',
    subgroups: [
      {
        label: 'Interior Inspections',
        products: [
          '1004 Single Family Interior Group',
          '1004 Hybrid Group',
          '1073 Condo Interior Group',
          'Co-Op - 2090 - Interior Group',
          'Desktop Interior Group',
          'Partial Release Group',
        ],
      },
      {
        label: 'Exterior Inspections',
        products: [
          '1004 Desktop Group',
          '2055 Single Family Exterior Group',
          '1075 Condo Exterior Group',
          'Co-Op - 2095 - Exterior Group',
          'Desktop Exterior Group',
          'BoA Desktop Valuation (Panel)',
        ],
      },
      {
        label: 'Review & Desktop',
        products: [
          'Desk Review Group',
          'Field Review 2000 Group',
          'FHLMC 2070 Group',
          'FHLMC 704 Group',
          'FNMA 2065 Group',
          'FNMA 2075 Group',
        ],
      },
      {
        label: 'Specialized',
        products: [
          'Manufactured Home - 1004C Group',
          'Multi Unit - 1025 - 2 Unit Group',
          'Multi Unit - 1025 - 3 Unit Group',
          'Multi Unit - 1025 - 4 Unit Group',
          'Land Appraisal Group',
        ],
      },
    ],
  },
  {
    id: 'fha',
    label: 'FHA Loans',
    subgroups: [
      {
        label: 'Interior Inspections',
        products: [
          'FHA 1004 Single Family Interior Group',
          'FHA 1073 Condo Interior Group',
          'FHA Co-Op - 2090 - Interior Group',
          'FHA Appraisal Update - 1004D Group',
        ],
      },
      {
        label: 'Exterior Inspections',
        products: [
          'FHA 2055 Single Family Exterior Group',
          'FHA 1075 Condo Exterior Group',
          'FHA Co-Op - 2095 - Exterior Group',
          'FHA Field Review 2000 Group',
          'FHA Land Appraisal Group',
        ],
      },
      {
        label: 'Review & Desktop',
        products: ['FHA Desk Review Group'],
      },
      {
        label: 'Specialized',
        products: [
          'FHA Manufactured Home - 1004C Group',
          'FHA Multi-Family - 1025 - 2 Unit Group',
          'FHA Multi-Family - 1025 - 3 Unit Group',
          'FHA Multi-Family - 1025 - 4 Unit Group',
        ],
      },
    ],
  },
  {
    id: 'usda',
    label: 'USDA Loans',
    subgroups: [
      { label: '', products: ['USDA Group'] },
    ],
  },
  {
    id: 'specialty',
    label: 'Specialty Products',
    subgroups: [
      {
        label: '',
        products: [
          'Disaster Inspection Group',
          'Occupancy Inspection Report',
          'Plan and Specs Group',
          'Rental Survey / Operating Income Statement Group',
          'Priced Per Transaction Group',
        ],
      },
    ],
  },
];

export const ALL_PRODUCTS = PRODUCT_GROUPS.flatMap((g) =>
  g.subgroups.flatMap((s) => s.products)
);

/* ─── Fee category logic ──────────────────────────────────────────── */
export function categorizeProducts(selectedProducts) {
  const cats = {
    fullInterior: [],
    exterior: [],
    desktop: [],
    multiFamily2: [],
    multiFamily3: [],
    multiFamily4: [],
    fieldReview: [],
    specialized: [],
  };

  for (const p of selectedProducts) {
    const u = p.toLowerCase();
    if (u.includes('field review 2000')) {
      cats.fieldReview.push(p);
    } else if (u.includes('1025') && u.includes('2 unit')) {
      cats.multiFamily2.push(p);
    } else if (u.includes('1025') && u.includes('3 unit')) {
      cats.multiFamily3.push(p);
    } else if (u.includes('1025') && u.includes('4 unit')) {
      cats.multiFamily4.push(p);
    } else if (
      u.includes('interior') ||
      u.includes('hybrid') ||
      u.includes('1004d') ||
      u.includes('partial release')
    ) {
      cats.fullInterior.push(p);
    } else if (
      u.includes('exterior') ||
      u.includes('2055') ||
      u.includes('1075')
    ) {
      cats.exterior.push(p);
    } else if (
      u.includes('desktop') ||
      u.includes('desk review') ||
      u.includes('2065') ||
      u.includes('2070') ||
      u.includes('2075') ||
      u.includes('704')
    ) {
      cats.desktop.push(p);
    } else {
      cats.specialized.push(p);
    }
  }

  return cats;
}

/* ─── US states ───────────────────────────────────────────────────── */
export const US_STATES = [
  { code: 'AL', name: 'Alabama' }, { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' }, { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' }, { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' }, { code: 'DE', name: 'Delaware' },
  { code: 'FL', name: 'Florida' }, { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' }, { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' }, { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' }, { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' }, { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' }, { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' }, { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' }, { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' }, { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' }, { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' }, { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' }, { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' }, { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' }, { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' }, { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' }, { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' }, { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' }, { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' }, { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' }, { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' }, { code: 'WY', name: 'Wyoming' },
];

/* ─── County data for major states ───────────────────────────────── */
export const COUNTIES = {
  TX: ['Harris','Dallas','Tarrant','Bexar','Travis','Collin','Hidalgo','El Paso','Denton','Fort Bend','Montgomery','Williamson','Cameron','Nueces','Brazoria','Bell','Galveston','Lubbock','Jefferson','Webb','Hays','Smith','Brazos','Johnson','McLennan','Midland','Ector','Guadalupe','Parker','Comal'],
  CA: ['Los Angeles','San Diego','Orange','Riverside','San Bernardino','Santa Clara','Alameda','Sacramento','Contra Costa','Fresno','Kern','San Francisco','Ventura','San Mateo','San Joaquin','Sonoma','Tulare','Stanislaus','Marin','Napa','Placer','Shasta','Santa Barbara','El Dorado','Yolo'],
  FL: ['Miami-Dade','Broward','Palm Beach','Hillsborough','Orange','Pinellas','Duval','Lee','Polk','Brevard','Volusia','Pasco','Seminole','Sarasota','Manatee','Collier','Osceola','St. Johns','Lake','Alachua','Marion','Escambia','St. Lucie','Flagler','Hernando'],
  NY: ['Kings','Queens','New York','Suffolk','Nassau','Bronx','Westchester','Erie','Monroe','Richmond','Onondaga','Rockland','Albany','Dutchess','Orange','Saratoga','Niagara','Oneida','Rensselaer','Ulster'],
  IL: ['Cook','DuPage','Lake','Will','Kane','McHenry','Winnebago','St. Clair','Champaign','Sangamon','Madison','Peoria','McLean','Kendall','Kankakee','Rock Island','Tazewell','DeKalb','Macon','Vermilion'],
  GA: ['Fulton','DeKalb','Gwinnett','Cobb','Clayton','Cherokee','Forsyth','Hall','Henry','Paulding','Richmond','Chatham','Clarke','Muscogee','Bibb','Columbia','Houston','Carroll','Coweta','Fayette'],
  OH: ['Franklin','Cuyahoga','Hamilton','Summit','Montgomery','Lucas','Butler','Stark','Lorain','Mahoning','Warren','Lake','Medina','Delaware','Clermont','Licking','Trumbull','Greene','Union','Wayne'],
  PA: ['Philadelphia','Allegheny','Montgomery','Bucks','Delaware','Chester','Lancaster','York','Berks','Westmoreland','Luzerne','Lehigh','Northampton','Erie','Dauphin','Lackawanna','Chester','Cambria','Cumberland','Blair'],
  NC: ['Mecklenburg','Wake','Guilford','Forsyth','Cumberland','Durham','Buncombe','Union','Cabarrus','Iredell','Gaston','Johnston','Catawba','Onslow','New Hanover','Davidson','Alamance','Randolph','Rowan','Pitt'],
  TN: ['Shelby','Davidson','Knox','Hamilton','Rutherford','Williamson','Montgomery','Sumner','Wilson','Maury','Sullivan','Blount','Washington','Bradley','Madison','Sevier','Roane','Anderson','Putnam','Murfreesboro'],
  AZ: ['Maricopa','Pima','Pinal','Yavapai','Yuma','Coconino','Mohave','Navajo','Cochise','Apache','Graham','Santa Cruz','Gila','La Paz','Greenlee'],
  CO: ['El Paso','Denver','Jefferson','Arapahoe','Adams','Larimer','Weld','Douglas','Boulder','Pueblo','Broomfield','Mesa','Garfield','Eagle','Summit','Fremont','Montrose'],
  WA: ['King','Pierce','Snohomish','Spokane','Clark','Thurston','Kitsap','Whatcom','Benton','Skagit','Yakima','Cowlitz','Grant','Franklin','Island','Lewis','Mason'],
  MI: ['Wayne','Oakland','Macomb','Kent','Genesee','Washtenaw','Ingham','Ottawa','Kalamazoo','Saginaw','Jackson','Muskegon','Bay','Berrien','Calhoun','Livingston','Monroe','St. Clair','Midland'],
  VA: ['Fairfax','Prince William','Loudoun','Chesterfield','Henrico','Virginia Beach city','Norfolk city','Arlington','Chesapeake city','Richmond city','Roanoke city','Hampton city','Newport News city','Alexandria city'],
};
