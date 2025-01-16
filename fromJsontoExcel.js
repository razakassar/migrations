const XLSX = require('xlsx');
const fs = require('fs');

function readJSONFromFile(filePath) {
	const jsonString = fs.readFileSync(filePath, 'utf-8');
	return JSON.parse(jsonString);
}

function writeToExcel({ entities }, excelFilePath, columnTitles) {
	const flatData = entities.map(({ properties }) => ({
		name: properties?.name ?? "",
		phone_number: properties?.phone_number ?? "",
		linkedin: properties?.linkedin?.value ?? "",
		facebook: properties?.facebook?.value ?? "",
		twitter: properties?.twitter?.value ?? "",
		website: properties?.website?.value ?? "",
		contact_email: properties?.contact_email ?? "",
	}));

	const worksheet = XLSX.utils.json_to_sheet(flatData, {
		header: columnTitles,
		skipHeader: true
	});

	for (let i = 0; i < columnTitles.length; i++) {
		const cellRef = XLSX.utils.encode_cell({ c: i, r: 0 });
		if (!worksheet[cellRef]) {
			worksheet[cellRef] = {};
		}
		worksheet[cellRef].v = columnTitles[i];
	}

	if (worksheet['!ref']) {
		const range = XLSX.utils.decode_range(worksheet['!ref']);
		range.s.r = 0;
		worksheet['!ref'] = XLSX.utils.encode_range(range);
	}

	const workbook = XLSX.utils.book_new();
	XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
	XLSX.writeFile(workbook, excelFilePath);
}

const jsonFilePath = '/home/ubuntu/Downloads/response_1710708164012.json';
const excelFilePath = 'email5.xlsx';

const jsonData = readJSONFromFile(jsonFilePath);
const columnTitles = ['name', 'phone_number', 'linkedin', 'facebook', 'twitter', 'website', 'contact_email'];

writeToExcel(jsonData, excelFilePath, columnTitles);
console.log('Excel file has been written with custom column titles.');
