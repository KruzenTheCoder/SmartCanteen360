import { Test } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { EmployeesRepository } from './employees.repository';
import { PrismaService } from '../database/prisma.service';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';

describe('EmployeesService', () => {
  let service: EmployeesService;
  let repo: jest.Mocked<EmployeesRepository>;

  beforeEach(async () => {
    const repoMock: Partial<jest.Mocked<EmployeesRepository>> = {
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      findById: jest.fn(),
      findByNumber: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        EmployeesService,
        { provide: EmployeesRepository, useValue: repoMock },
        { provide: PrismaService, useValue: { employee: { groupBy: jest.fn() } } },
      ],
    }).compile();

    service = moduleRef.get(EmployeesService);
    repo = moduleRef.get(EmployeesRepository);
  });

  it('paginates results', async () => {
    const query = Object.assign(new PaginationQueryDto(), { page: 1, pageSize: 20 });
    const result = await service.findAll('company-1', query);
    expect(result.pagination.total).toBe(0);
    expect(repo.findMany).toHaveBeenCalled();
  });

  it('rejects duplicate employee numbers', async () => {
    repo.findByNumber.mockResolvedValue({ id: 'x' } as never);
    await expect(
      service.create('company-1', {
        employeeNumber: 'E-1',
        firstName: 'A',
        lastName: 'B',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('throws when an employee is missing', async () => {
    repo.findById.mockResolvedValue(null);
    await expect(service.findOne('company-1', 'missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
