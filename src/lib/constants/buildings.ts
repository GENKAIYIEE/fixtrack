export const BUILDINGS = [
  { value: 'COLLEGE_BUILDING', label: 'College Building' },
  { value: 'BASIC_EDUCATION_BUILDING', label: 'Basic Education Building' }
];

export const BUILDING_AREAS: Record<string, string[]> = {
  COLLEGE_BUILDING: [
    'Computer Laboratory',
    'Faculty Room',
    'Library',
    'Canteen',
    'Classroom',
    'Clinic',
    'Restroom',
    'Hallway',
    'Others'
  ],
  BASIC_EDUCATION_BUILDING: [
    'Classroom',
    'Faculty Room',
    'Restroom',
    'Hallway',
    'Others'
  ]
};

export const getBuildingLabel = (value: string): string => {
  const building = BUILDINGS.find(b => b.value === value);
  return building?.label || value;
};
