// Unit Categories and Types for Custom Steps

export interface UnitOption {
  value: string;
  label: string;
  input_type?: "number" | "range" | "time" | "text" | "blood_pressure";
  min?: number;
  max?: number;
  step?: number;
}

export interface UnitCategory {
  category: string;
  label: string;
  units: UnitOption[];
}

export const UNIT_CATEGORIES: UnitCategory[] = [
  {
    category: "general",
    label: "General",
    units: [
      { value: "count", label: "Count (number)", input_type: "number", min: 0 },
      {
        value: "servings",
        label: "Servings (number)",
        input_type: "number",
        min: 0,
        step: 0.5,
      },
      { value: "steps", label: "Steps (number)", input_type: "number", min: 0 },
      {
        value: "pain_level",
        label: "Pain Level (1-5)",
        input_type: "range",
        min: 1,
        max: 5,
      },
      {
        value: "mood",
        label: "Mood (1-5)",
        input_type: "range",
        min: 1,
        max: 5,
      },
      {
        value: "energy_level",
        label: "Energy Level (1-5)",
        input_type: "range",
        min: 1,
        max: 5,
      },
      {
        value: "productivity",
        label: "Productivity (1-5)",
        input_type: "range",
        min: 1,
        max: 5,
      },
      { value: "yes_no", label: "Yes/No", input_type: "range", min: 0, max: 1 },
      {
        value: "percentage",
        label: "Percentage (%)",
        input_type: "number",
        min: 0,
        max: 100,
      },
      {
        value: "stars",
        label: "Stars (1-5)",
        input_type: "range",
        min: 1,
        max: 5,
      },
      {
        value: "points",
        label: "Points (1-5)",
        input_type: "range",
        min: 1,
        max: 5,
      },
    ],
  },
  {
    category: "time",
    label: "Time",
    units: [
      {
        value: "time_of_day",
        label: "Time of Day",
        input_type: "time",
      },
      {
        value: "duration_seconds",
        label: "Duration (seconds)",
        input_type: "number",
        min: 0,
      },
      {
        value: "duration_minutes",
        label: "Duration (minutes)",
        input_type: "number",
        min: 0,
        step: 0.5,
      },
      {
        value: "duration_hours",
        label: "Duration (hours)",
        input_type: "number",
        min: 0,
        step: 0.25,
      },
      {
        value: "duration_days",
        label: "Duration (days)",
        input_type: "number",
        min: 0,
        step: 0.5,
      },
      {
        value: "duration_weeks",
        label: "Duration (weeks)",
        input_type: "number",
        min: 0,
        step: 0.5,
      },
      {
        value: "duration_months",
        label: "Duration (months)",
        input_type: "number",
        min: 0,
        step: 0.5,
      },
      {
        value: "duration_years",
        label: "Duration (years)",
        input_type: "number",
        min: 0,
        step: 0.1,
      },
    ],
  },
  {
    category: "frequency",
    label: "Frequency",
    units: [
      { value: "per_day", label: "Per Day", input_type: "number", min: 0 },
      { value: "per_week", label: "Per Week", input_type: "number", min: 0 },
      { value: "per_month", label: "Per Month", input_type: "number", min: 0 },
    ],
  },
  {
    category: "health",
    label: "Health",
    units: [
      {
        value: "blood_pressure",
        label: "Blood Pressure (systolic/diastolic mmHg)",
        input_type: "blood_pressure",
      },
      {
        value: "heart_rate",
        label: "Heart Rate (bpm)",
        input_type: "number",
        min: 30,
        max: 220,
      },
      {
        value: "body_temp_celsius",
        label: "Body Temperature (°C)",
        input_type: "number",
        min: 30,
        max: 45,
        step: 0.1,
      },
      {
        value: "body_temp_fahrenheit",
        label: "Body Temperature (°F)",
        input_type: "number",
        min: 86,
        max: 113,
        step: 0.1,
      },
      {
        value: "blood_sugar_mg",
        label: "Blood Sugar (mg/dL)",
        input_type: "number",
        min: 20,
        max: 600,
      },
      {
        value: "blood_sugar_mmol",
        label: "Blood Sugar (mmol/L)",
        input_type: "number",
        min: 1,
        max: 33,
        step: 0.1,
      },
      {
        value: "cholesterol",
        label: "Cholesterol (mg/dL)",
        input_type: "number",
        min: 50,
        max: 500,
      },
      {
        value: "oxygen_saturation",
        label: "Oxygen Saturation (%)",
        input_type: "number",
        min: 70,
        max: 100,
      },
      {
        value: "respiratory_rate",
        label: "Respiratory Rate (breaths/min)",
        input_type: "number",
        min: 5,
        max: 60,
      },
      {
        value: "sleep_duration",
        label: "Sleep Duration (hours)",
        input_type: "number",
        min: 0,
        max: 24,
        step: 0.25,
      },
      {
        value: "calories",
        label: "Calories (kcal)",
        input_type: "number",
        min: 0,
      },
      {
        value: "water_liters",
        label: "Water Intake (liters)",
        input_type: "number",
        min: 0,
        step: 0.1,
      },
      {
        value: "water_ounces",
        label: "Water Intake (ounces)",
        input_type: "number",
        min: 0,
        step: 0.5,
      },
      { value: "dosage", label: "Dosage (specify unit)", input_type: "text" },
    ],
  },
  {
    category: "weight",
    label: "Weight/Mass",
    units: [
      {
        value: "grams",
        label: "Grams (g)",
        input_type: "number",
        min: 0,
        step: 0.1,
      },
      {
        value: "kilograms",
        label: "Kilograms (kg)",
        input_type: "number",
        min: 0,
        step: 0.1,
      },
      {
        value: "ounces",
        label: "Ounces (oz)",
        input_type: "number",
        min: 0,
        step: 0.1,
      },
      {
        value: "pounds",
        label: "Pounds (lb)",
        input_type: "number",
        min: 0,
        step: 0.1,
      },
    ],
  },
  {
    category: "volume",
    label: "Volume",
    units: [
      {
        value: "milliliters",
        label: "Milliliters (ml)",
        input_type: "number",
        min: 0,
        step: 0.5,
      },
      {
        value: "liters",
        label: "Liters (l)",
        input_type: "number",
        min: 0,
        step: 0.1,
      },
      {
        value: "fluid_ounces",
        label: "Fluid Ounces (fl oz)",
        input_type: "number",
        min: 0,
        step: 0.25,
      },
      {
        value: "teaspoons",
        label: "Teaspoons (tsp)",
        input_type: "number",
        min: 0,
        step: 0.25,
      },
      {
        value: "tablespoons",
        label: "Tablespoons (tbsp)",
        input_type: "number",
        min: 0,
        step: 0.25,
      },
      {
        value: "cups",
        label: "Cups",
        input_type: "number",
        min: 0,
        step: 0.25,
      },
      {
        value: "pints",
        label: "Pints (pt)",
        input_type: "number",
        min: 0,
        step: 0.25,
      },
      {
        value: "quarts",
        label: "Quarts (qt)",
        input_type: "number",
        min: 0,
        step: 0.25,
      },
      {
        value: "gallons",
        label: "Gallons (gal)",
        input_type: "number",
        min: 0,
        step: 0.1,
      },
    ],
  },
  {
    category: "distance",
    label: "Distance",
    units: [
      {
        value: "meters",
        label: "Meters (m)",
        input_type: "number",
        min: 0,
        step: 0.1,
      },
      {
        value: "kilometers",
        label: "Kilometers (km)",
        input_type: "number",
        min: 0,
        step: 0.1,
      },
      {
        value: "feet",
        label: "Feet (ft)",
        input_type: "number",
        min: 0,
        step: 0.1,
      },
      {
        value: "miles",
        label: "Miles (mi)",
        input_type: "number",
        min: 0,
        step: 0.1,
      },
    ],
  },
  {
    category: "speed",
    label: "Speed",
    units: [
      {
        value: "meters_per_second",
        label: "Meters per Second (m/s)",
        input_type: "number",
        min: 0,
        step: 0.1,
      },
      {
        value: "kilometers_per_hour",
        label: "Kilometers per Hour (km/h)",
        input_type: "number",
        min: 0,
        step: 0.1,
      },
      {
        value: "miles_per_hour",
        label: "Miles per Hour (mph)",
        input_type: "number",
        min: 0,
        step: 0.1,
      },
    ],
  },
  {
    category: "area",
    label: "Area",
    units: [
      {
        value: "square_meters",
        label: "Square Meters (m²)",
        input_type: "number",
        min: 0,
        step: 0.1,
      },
      {
        value: "square_feet",
        label: "Square Feet (ft²)",
        input_type: "number",
        min: 0,
        step: 0.1,
      },
      {
        value: "acres",
        label: "Acres",
        input_type: "number",
        min: 0,
        step: 0.01,
      },
    ],
  },
  {
    category: "temperature",
    label: "Temperature",
    units: [
      {
        value: "celsius",
        label: "Celsius (°C)",
        input_type: "number",
        step: 0.1,
      },
      {
        value: "fahrenheit",
        label: "Fahrenheit (°F)",
        input_type: "number",
        step: 0.1,
      },
    ],
  },
  {
    category: "currency",
    label: "Currency",
    units: [
      {
        value: "currency",
        label: "Currency (specify)",
        input_type: "number",
        min: 0,
        step: 0.01,
      },
    ],
  },
  {
    category: "other",
    label: "Other",
    units: [{ value: "custom", label: "Custom", input_type: "text" }],
  },
];

// Helper functions
export function getUnitByValue(unitValue: string): UnitOption | undefined {
  for (const category of UNIT_CATEGORIES) {
    const unit = category.units.find((u) => u.value === unitValue);
    if (unit) return unit;
  }
  return undefined;
}

export function getCategoryByUnit(unitValue: string): UnitCategory | undefined {
  return UNIT_CATEGORIES.find((category) =>
    category.units.some((unit) => unit.value === unitValue)
  );
}

export function getAllUnits(): UnitOption[] {
  return UNIT_CATEGORIES.flatMap((category) => category.units);
}

// Custom step data types
export interface CustomStepAnswer {
  value: string | number;
  unit: string;
  systolic?: number; // For blood pressure
  diastolic?: number; // For blood pressure
  custom_unit?: string; // For custom units
}
