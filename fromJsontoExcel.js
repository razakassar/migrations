const XLSX = require('xlsx');
const fs = require('fs');

// Function to read JSON from a file
function readJSONFromFile(filePath) {
	const jsonString = fs.readFileSync(filePath, 'utf-8');
	return JSON.parse(jsonString);
}

// Function to write data to Excel
function writeToExcel(data, excelFilePath, columnTitles) {
	// Convert JSON to worksheet
	const worksheet = XLSX.utils.json_to_sheet(data, {
		header: columnTitles, // Define custom headers
		skipHeader: true // Skip the header row because we will add it manually
	});

	// Adding custom headers
	const range = XLSX.utils.decode_range(worksheet['!ref']); // get the range of the sheet
	for (let C = range.s.c; C <= range.e.c; ++C) {
		const address = XLSX.utils.encode_col(C) + "1"; // construct A1, B1, C1, ...
		if (!worksheet[address]) continue; // if cell doesn't exist, move on
		worksheet[address].v = columnTitles[C]; // assign the title to the cell value
	}

	// Create a new workbook
	const workbook = XLSX.utils.book_new();

	// Append the worksheet to the workbook
	XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

	// Write workbook to the excel file
	XLSX.writeFile(workbook, excelFilePath);
}

// File paths
const jsonFilePath = 'data.json';  // Path to your JSON file
const excelFilePath = 'output.xlsx'; // Path where you want to save the Excel file

// Read data from JSON file
const jsonData = readJSONFromFile(jsonFilePath);

// Define your column titles order
const columnTitles = ['Name', 'City', 'Age'];

// Write data to Excel file with custom column titles
writeToExcel(jsonData, excelFilePath, columnTitles);

console.log('Excel file has been written with custom column titles.');
