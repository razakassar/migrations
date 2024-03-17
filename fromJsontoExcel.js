const XLSX = require('xlsx');
const fs = require('fs');

// Function to read JSON from a file
function readJSONFromFile(filePath) {
	const jsonString = fs.readFileSync(filePath, 'utf-8');
	return JSON.parse(jsonString);
}

function writeToExcel({ entities }, excelFilePath, columnTitles) {
	// Flatten the data objects
	const flatData = entities.map(({ properties }) => ({
		name: properties?.name ?? "",
		phone_number: properties?.phone_number ?? "",
		linkedin: properties?.linkedin?.value ?? "",
		facebook: properties?.facebook?.value ?? "",
		twitter: properties?.twitter?.value ?? "",
		website: properties?.website?.value ?? "",
		contact_email: properties?.contact_email ?? "",
	}));

	// Convert the flat JSON array to a worksheet
	const worksheet = XLSX.utils.json_to_sheet(flatData, {
		header: columnTitles,
		skipHeader: true // We'll add the header manually
	});

	// Add the header row manually
	for (let i = 0; i < columnTitles.length; i++) {
		const cellRef = XLSX.utils.encode_cell({ c: i, r: 0 }); // Cell reference in A1 format
		if (!worksheet[cellRef]) {
			worksheet[cellRef] = {};
		}
		worksheet[cellRef].v = columnTitles[i]; // Set the value of the cell to the column title
	}

	// Adjust starting range of the worksheet if not A1
	if (worksheet['!ref']) {
		const range = XLSX.utils.decode_range(worksheet['!ref']);
		range.s.r = 0; // Set start row to 0
		worksheet['!ref'] = XLSX.utils.encode_range(range);
	}

	// Create a new workbook and append the worksheet
	const workbook = XLSX.utils.book_new();
	XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');

	// Write the workbook to the file
	XLSX.writeFile(workbook, excelFilePath);
}

// File paths
const jsonFilePath = '/home/ubuntu/Downloads/response_1710708164012.json';  // Path to your JSON file
const excelFilePath = 'email5.xlsx'; // Path where you want to save the Excel file

// Read data from JSON file
const jsonData = readJSONFromFile(jsonFilePath);
// Define your column titles order
const columnTitles = ['name', 'phone_number', 'linkedin', 'facebook', 'twitter', 'website', 'contact_email'];

// Write data to Excel file with custom column titles
writeToExcel(jsonData, excelFilePath, columnTitles);

console.log('Excel file has been written with custom column titles.');
