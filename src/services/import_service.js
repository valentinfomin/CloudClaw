// src/services/import_service.js

export function mapData(sourceData, targetModel, mapping, requiredFields = []) {
    if (!sourceData) {
        return { ...targetModel };
    }

    const result = { ...targetModel };
    for (const sourceKey in mapping) {
        if (sourceData.hasOwnProperty(sourceKey)) {
            const targetKey = mapping[sourceKey];
            result[targetKey] = sourceData[sourceKey];
        }
    }

    // Also copy properties that have same name and are in the target model
    for (const key in sourceData) {
        if (sourceData.hasOwnProperty(key) && targetModel.hasOwnProperty(key) && !Object.values(mapping).includes(key)) {
            result[key] = sourceData[key];
        }
    }

    for (const field of requiredFields) {
        if (result[field] === null || result[field] === undefined) {
            return null;
        }
    }

    return result;
}
