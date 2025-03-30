# ZOARCH Lab Inventory System

A web-based inventory management system for zoological and archaeological laboratory specimens. This application provides a user-friendly interface to browse, search, update, and analyze specimen collections.

## Features

- **Interactive Dashboard**: View key metrics and visualizations of your collection
- **Comprehensive Inventory Browser**: Filter and search through specimens with advanced sorting
- **Statistical Visualizations**: Analyze distribution across taxonomic groups and locations
- **Data Management**: Import and export data in Excel/CSV formats
- **Add and Edit Entries**: Update specimen information with an easy-to-use form interface
- **Browser-Based Storage**: Works offline with local storage for data persistence

## Technology Stack

- HTML5, CSS3, and JavaScript
- Bootstrap 5 for responsive design
- Chart.js for data visualization
- DataTables for enhanced table functionality
- SheetJS for Excel file handling

## Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Edge, Safari)
- Git (for cloning the repository)
- A GitHub account (if you want to fork or contribute)

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/zoarch-lab-inventory.git
cd zoarch-lab-inventory
```

2. **Set up the file structure**

Ensure your directory structure looks like this:

```
zoarch-lab-inventory/
│
├── css/
│   └── styles.css
│
├── js/
│   ├── app.js
│   ├── charts.js
│   └── database.js
│
├── data/
│   └── sample_inventory.json
│
└── index.html
```

3. **Deploy the website**

You can deploy this site in several ways:

- **Local Development**: Simply open the `index.html` file in your browser
- **GitHub Pages**: Push to a GitHub repository and enable GitHub Pages
- **Web Server**: Deploy to any web server that can serve static files

## Usage Guide

### Initial Setup

1. When you first open the application, sample data will be loaded automatically
2. To use your own data, go to the "Update Data" section and import your Excel file

### Navigating the Interface

- **Dashboard**: View key metrics and statistics about your collection
- **Inventory**: Browse through the complete inventory with filtering options
- **Statistics**: Explore visualizations of your collection across various dimensions
- **Update Data**: Import/export data and add or edit individual entries
- **About**: Information about the application

### Managing Your Data

#### Importing Data

1. Navigate to the "Update Data" section
2. Click "Choose File" and select your Excel (.xlsx) or CSV file
3. Choose whether to append to or replace existing data
4. Click "Import Data"

#### Adding New Entries

1. Navigate to the "Update Data" section
2. Scroll to "Add New Entry"
3. Fill in the specimen details
4. Click "Add Entry"

#### Editing Existing Entries

1. Navigate to the "Update Data" section
2. Scroll to "Edit Existing Entries"
3. Enter the Catalog # of the entry you want to edit
4. Update the information as needed
5. Click "Save Changes"

#### Exporting Data

1. Navigate to the "Update Data" section
2. Click "Export to Excel" or "Export to CSV"
3. The file will download automatically

## Data Structure

The application expects data with the following fields (not all are required):

- **Owner**: Who owns the specimen
- **Catalog #**: Unique identifier for the specimen
- **# of specimens**: Quantity
- **Order**: Taxonomic order
- **Family**: Taxonomic family
- **Genus**: Taxonomic genus
- **Species**: Taxonomic species
- **Common Name**: Vernacular name
- **Location**: Where the specimen was found
- **Country**: Country of origin
- **How collected**: Method of acquisition
- **Date collected**: When the specimen was collected
- **Notes**: Additional information

## Customization

### Modifying the Interface

The interface is built using Bootstrap 5, which makes it easy to customize:

- **Colors and Styles**: Edit the `css/styles.css` file
- **Layout**: Modify the HTML structure in `index.html`
- **Functionality**: Adjust the JavaScript in the `js/` folder

### Adding New Features

The codebase is structured to be easily extensible:

- **Database Module**: `js/database.js` handles all data operations
- **Charts Module**: `js/charts.js` manages all visualizations
- **App Module**: `js/app.js` controls the UI and brings everything together

## Future Improvements

- User authentication for multi-user access
- Cloud sync for collaborative editing
- Advanced filtering by geographic location
- Image attachment capability for specimens
- QR code generation for physical labeling

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Acknowledgments

- Bootstrap team for the excellent CSS framework
- Chart.js for the visualization library
- SheetJS for Excel file handling
- DataTables for enhanced table functionality
