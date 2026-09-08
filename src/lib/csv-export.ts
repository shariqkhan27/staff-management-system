export function exportToCSV(data: any[], filename: string) {
  if (!data || data.length === 0) return;

  // Get headers from first object
  const headers = Object.keys(data[0]);

  // Convert array of objects to CSV string
  const csvRows = [];
  
  // Add headers
  csvRows.push(headers.join(","));

  // Add rows
  for (const row of data) {
    const values = headers.map(header => {
      const val = row[header];
      // Handle commas, quotes, and newlines in data
      if (val === null || val === undefined) {
        return "";
      } else if (typeof val === "object") {
        return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
      } else {
        const strVal = String(val);
        if (strVal.includes(",") || strVal.includes('"') || strVal.includes("\n")) {
          return `"${strVal.replace(/"/g, '""')}"`;
        }
        return strVal;
      }
    });
    csvRows.push(values.join(","));
  }

  // Create blob and download link
  const csvString = csvRows.join("\n");
  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  link.style.visibility = "hidden";
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
