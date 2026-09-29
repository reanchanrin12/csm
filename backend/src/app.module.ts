import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { VehiclesModule } from './modules/vehicles/vehicles.module';
import { CostsModule } from './modules/costs/costs.module';
import { SalesModule } from './modules/sales/sales.module';
import { ExpensesModule } from './modules/expenses/expenses.module';
import { EmployeesModule } from './modules/employees/employees.module';
import { TransfersModule } from './modules/transfers/transfers.module';
import { SettingsModule } from './modules/settings/settings.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    VehiclesModule,
    CostsModule,
    SalesModule,
    ExpensesModule,
    EmployeesModule,
    TransfersModule,
    SettingsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
