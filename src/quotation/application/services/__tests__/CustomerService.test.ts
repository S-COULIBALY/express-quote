import { CustomerService } from '../CustomerService';
import { ICustomerRepository } from '../../../../domain/repositories/ICustomerRepository';
import { Customer } from '../../../../domain/entities/Customer';

describe('CustomerService', () => {
    let customerService: CustomerService;
    let mockCustomerRepository: jest.Mocked<ICustomerRepository>;

    beforeEach(() => {
        mockCustomerRepository = {
            findAll: jest.fn(),
            findById: jest.fn(),
            findByEmail: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            delete: jest.fn()
        };

        customerService = new CustomerService(mockCustomerRepository);
    });

    describe('createCustomer', () => {
        it('should create a new customer', async () => {
            const customerData = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com',
                phone: '1234567890'
            };

            const mockCustomer = new Customer(
                '1',
                customerData.firstName,
                customerData.lastName,
                customerData.email,
                customerData.phone
            );

            mockCustomerRepository.save.mockResolvedValue(mockCustomer);

            const result = await customerService.createCustomer(customerData);

            expect(result).toBeDefined();
            expect(result.id).toBe('1');
            expect(result.firstName).toBe(customerData.firstName);
            expect(result.lastName).toBe(customerData.lastName);
            expect(result.email).toBe(customerData.email);
            expect(result.phone).toBe(customerData.phone);
            expect(mockCustomerRepository.save).toHaveBeenCalled();
        });
    });

    describe('updateCustomer', () => {
        it('should update an existing customer', async () => {
            const customerId = '1';
            const updateData = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com',
                phone: '1234567890'
            };

            const existingCustomer = new Customer(
                customerId,
                'Jane',
                'Smith',
                'jane@example.com',
                '0987654321'
            );

            const updatedCustomer = new Customer(
                customerId,
                updateData.firstName,
                updateData.lastName,
                updateData.email,
                updateData.phone
            );

            mockCustomerRepository.findById.mockResolvedValue(existingCustomer);
            mockCustomerRepository.update.mockResolvedValue(updatedCustomer);

            const result = await customerService.updateCustomer(customerId, updateData);

            expect(result).toBeDefined();
            expect(result.id).toBe(customerId);
            expect(result.firstName).toBe(updateData.firstName);
            expect(result.lastName).toBe(updateData.lastName);
            expect(result.email).toBe(updateData.email);
            expect(result.phone).toBe(updateData.phone);
            expect(mockCustomerRepository.update).toHaveBeenCalled();
        });

        it('should throw error if customer not found', async () => {
            const customerId = '1';
            const updateData = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com',
                phone: '1234567890'
            };

            mockCustomerRepository.findById.mockResolvedValue(null);

            await expect(customerService.updateCustomer(customerId, updateData))
                .rejects
                .toThrow('Customer not found');
        });
    });

    describe('findCustomerById', () => {
        it('should find a customer by id', async () => {
            const customerId = '1';
            const mockCustomer = new Customer(
                customerId,
                'John',
                'Doe',
                'john@example.com',
                '1234567890'
            );

            mockCustomerRepository.findById.mockResolvedValue(mockCustomer);

            const result = await customerService.findCustomerById(customerId);

            expect(result).toBeDefined();
            expect(result.id).toBe(customerId);
            expect(mockCustomerRepository.findById).toHaveBeenCalledWith(customerId);
        });

        it('should return null if customer not found', async () => {
            const customerId = '1';
            mockCustomerRepository.findById.mockResolvedValue(null);

            const result = await customerService.findCustomerById(customerId);

            expect(result).toBeNull();
            expect(mockCustomerRepository.findById).toHaveBeenCalledWith(customerId);
        });
    });

    describe('findCustomerByEmail', () => {
        it('should find a customer by email', async () => {
            const email = 'john@example.com';
            const mockCustomer = new Customer(
                '1',
                'John',
                'Doe',
                email,
                '1234567890'
            );

            mockCustomerRepository.findByEmail.mockResolvedValue(mockCustomer);

            const result = await customerService.findCustomerByEmail(email);

            expect(result).toBeDefined();
            expect(result.email).toBe(email);
            expect(mockCustomerRepository.findByEmail).toHaveBeenCalledWith(email);
        });

        it('should return null if customer not found', async () => {
            const email = 'john@example.com';
            mockCustomerRepository.findByEmail.mockResolvedValue(null);

            const result = await customerService.findCustomerByEmail(email);

            expect(result).toBeNull();
            expect(mockCustomerRepository.findByEmail).toHaveBeenCalledWith(email);
        });
    });

    describe('deleteCustomer', () => {
        it('should delete a customer', async () => {
            const customerId = '1';
            const mockCustomer = new Customer(
                customerId,
                'John',
                'Doe',
                'john@example.com',
                '1234567890'
            );

            mockCustomerRepository.findById.mockResolvedValue(mockCustomer);
            mockCustomerRepository.delete.mockResolvedValue(true);

            const result = await customerService.deleteCustomer(customerId);

            expect(result).toBe(true);
            expect(mockCustomerRepository.delete).toHaveBeenCalledWith(customerId);
        });

        it('should throw error if customer not found', async () => {
            const customerId = '1';
            mockCustomerRepository.findById.mockResolvedValue(null);

            await expect(customerService.deleteCustomer(customerId))
                .rejects
                .toThrow('Customer not found');
        });
    });
}); 