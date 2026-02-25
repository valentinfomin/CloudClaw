import { describe, it, expect } from 'vitest';
import { mapData } from '../src/services/import_service.js';

describe('Data Import Service', () => {
    describe('mapData', () => {
        it('should correctly map source data to the target model based on matching keys', () => {
            const sourceData = {
                'user_name': 'John Doe',
                'user_email': 'john.doe@example.com',
                'age': 30,
                'extra_field': 'should be ignored'
            };

            const targetModel = {
                name: null,
                email: null,
                age: null
            };

            const expected = {
                name: 'John Doe',
                email: 'john.doe@example.com',
                age: 30
            };

            // This test will fail because we will map user_name to name and user_email to email
            const result = mapData(sourceData, targetModel, {
                'user_name': 'name',
                'user_email': 'email'
            });

            expect(result).toEqual(expected);
        });

        it('should automatically map fields with the same name', () => {
            const sourceData = {
                'name': 'Jane Doe',
                'email': 'jane.doe@example.com',
                'age': 28,
            };

            const targetModel = {
                name: null,
                email: null,
                age: null
            };

            const expected = {
                name: 'Jane Doe',
                email: 'jane.doe@example.com',
                age: 28
            };

            const result = mapData(sourceData, targetModel, {});

            expect(result).toEqual(expected);
        });

        it('should handle null or undefined source data gracefully', () => {
            const targetModel = {
                name: null,
                email: null,
            };

            const result1 = mapData(null, targetModel, {});
            const result2 = mapData(undefined, targetModel, {});

            expect(result1).toEqual(targetModel);
            expect(result2).toEqual(targetModel);
        });

        it('should return null if a required field is missing', () => {
            const sourceData = {
                'name': 'John Doe',
                // email is missing
            };

            const targetModel = {
                name: null,
                email: null,
            };

            const result = mapData(sourceData, targetModel, {}, ['email']);
            expect(result).toBeNull();
        });
    });
});
