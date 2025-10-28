// Utility function to sort faculties by city grouping
export const sortFacultiesByCity = (faculties: any[]) => {
  const cityOrder: Record<string, number> = {
    'Praha': 1,
    'Brno': 2,
    'Olomouc': 3,
    'Plzeň': 4,
    'Hradec Králové': 5,
  };

  return [...faculties].sort((a, b) => {
    // Extract city from faculty name (e.g., "LF UK Praha" -> "Praha")
    const getCityFromName = (name: string): string => {
      for (const city of Object.keys(cityOrder)) {
        if (name.includes(city)) {
          return city;
        }
      }
      return 'Ostatní';
    };

    const cityA = getCityFromName(a.name);
    const cityB = getCityFromName(b.name);
    
    const orderA = cityOrder[cityA] || 999;
    const orderB = cityOrder[cityB] || 999;

    // First sort by city
    if (orderA !== orderB) {
      return orderA - orderB;
    }

    // Then alphabetically within the same city
    return a.name.localeCompare(b.name, 'cs');
  });
};
