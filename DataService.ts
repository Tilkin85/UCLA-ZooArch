/**
 * DataService.ts
 * Service for handling data operations for the UCLA Comparative Catalog
 */

// Import the JSON data
// In a production environment, this would be fetched from an API
import fullDataset from '../data/full_dataset.json';
import taxonomicSummary from '../data/taxonomic_summary.json';
import geographicSummary from '../data/geographic_summary.json';

// Types for our data structures
export interface Specimen {
  'Collection ID': string;
  'Collector': string;
  'Class': string;
  'Order': string;
  'Family': string;
  'Genus': string;
  'Species': string;
  'Common Name': string;
  'Country': string;
  'State/Province': string;
  'Locality': string;
  'Collection Notes': string;
  [key: string]: any;
}

export interface TaxonomicSummary {
  classes: Record<string, number>;
  orders: Record<string, number>;
  families: Record<string, number>;
}

export interface GeographicSummary {
  countries: Record<string, number>;
  states: Record<string, number>;
}

export class DataService {
  // Get the full dataset
  static async getFullDataset(): Promise<Specimen[]> {
    // In a real application, this would fetch from an API
    // For now, we're using the imported JSON data
    return fullDataset as Specimen[];
  }

  // Get taxonomic summary data
  static async getTaxonomicSummary(): Promise<TaxonomicSummary> {
    return taxonomicSummary as TaxonomicSummary;
  }

  // Get geographic summary data
  static async getGeographicSummary(): Promise<GeographicSummary> {
    return geographicSummary as GeographicSummary;
  }

  // Update the dataset with new data
  static async updateDataset(newData: Specimen[]): Promise<boolean> {
    // In a real application, this would send data to an API
    // For this demo, we'll just log that an update was attempted
    console.log('Dataset update requested with', newData.length, 'specimens');
    return true;
  }

  // Filter specimens by criteria
  static filterSpecimens(
    specimens: Specimen[],
    criteria: {
      searchTerm?: string;
      field?: string;
      taxonomicFilters?: {
        class?: string;
        order?: string;
        family?: string;
      };
      geographicFilters?: {
        country?: string;
        state?: string;
      };
    }
  ): Specimen[] {
    return specimens.filter(specimen => {
      // Apply search term filter
      if (criteria.searchTerm && criteria.field) {
        if (criteria.field === 'all') {
          // Search in all fields
          const matchesSearch = Object.values(specimen).some(
            value => value && String(value).toLowerCase().includes(criteria.searchTerm!.toLowerCase())
          );
          if (!matchesSearch) return false;
        } else {
          // Search in specific field
          const fieldValue = specimen[criteria.field];
          if (!fieldValue || !String(fieldValue).toLowerCase().includes(criteria.searchTerm.toLowerCase())) {
            return false;
          }
        }
      }

      // Apply taxonomic filters
      const taxonomicFilters = criteria.taxonomicFilters || {};
      if (taxonomicFilters.class && specimen['Class'] !== taxonomicFilters.class) {
        return false;
      }
      if (taxonomicFilters.order && specimen['Order'] !== taxonomicFilters.order) {
        return false;
      }
      if (taxonomicFilters.family && specimen['Family'] !== taxonomicFilters.family) {
        return false;
      }

      // Apply geographic filters
      const geographicFilters = criteria.geographicFilters || {};
      if (geographicFilters.country && specimen['Country'] !== geographicFilters.country) {
        return false;
      }
      if (geographicFilters.state && specimen['State/Province'] !== geographicFilters.state) {
        return false;
      }

      return true;
    });
  }

  // Process CSV data for updates
  static async processCSVUpdate(csvContent: string): Promise<{ 
    success: boolean; 
    message: string; 
    data?: Specimen[] 
  }> {
    try {
      // In a real implementation, this would parse the CSV and validate the data
      // For this demo, we'll just return a success message
      return {
        success: true,
        message: 'CSV data processed successfully. Ready for update.',
        data: []
      };
    } catch (error) {
      return {
        success: false,
        message: `Error processing CSV data: ${error}`
      };
    }
  }

  // Process Excel data for updates
  static async processExcelUpdate(file: File): Promise<{ 
    success: boolean; 
    message: string; 
    data?: Specimen[] 
  }> {
    try {
      // In a real implementation, this would parse the Excel file and validate the data
      // For this demo, we'll just return a success message
      return {
        success: true,
        message: 'Excel data processed successfully. Ready for update.',
        data: []
      };
    } catch (error) {
      return {
        success: false,
        message: `Error processing Excel data: ${error}`
      };
    }
  }
}
