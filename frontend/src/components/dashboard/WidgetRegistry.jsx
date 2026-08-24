import * as AccountantWidgets from './widgets/AccountantWidgets';
import * as AdminWidgets from './widgets/AdminWidgets';
import * as AmbulanceWidgets from './widgets/AmbulanceWidgets';
import * as CoreWidgets from './widgets/CoreWidgets';
import * as FinanceWidgets from './widgets/FinanceWidgets';
import * as HrWidgets from './widgets/HrWidgets';
import * as InsuranceWidgets from './widgets/InsuranceWidgets';
import * as InventoryWidgets from './widgets/InventoryWidgets';
import * as LabWidgets from './widgets/LabWidgets';
import * as MarketingWidgets from './widgets/MarketingWidgets';
import * as NurseWidgets from './widgets/NurseWidgets';
import * as PatientWidgets from './widgets/PatientWidgets';
import * as PharmacyWidgets from './widgets/PharmacyWidgets';
import * as RadiologistWidgets from './widgets/RadiologistWidgets';
import * as ReceptionWidgets from './widgets/ReceptionWidgets';
import * as SupportWidgets from './widgets/SupportWidgets';
import * as VendorWidgets from './widgets/VendorWidgets';

export const WidgetRegistry = {
  ...AccountantWidgets,
  ...AdminWidgets,
  ...AmbulanceWidgets,
  ...CoreWidgets,
  ...FinanceWidgets,
  ...HrWidgets,
  ...InsuranceWidgets,
  ...InventoryWidgets,
  ...LabWidgets,
  ...MarketingWidgets,
  ...NurseWidgets,
  ...PatientWidgets,
  ...PharmacyWidgets,
  ...RadiologistWidgets,
  ...ReceptionWidgets,
  ...SupportWidgets,
  ...VendorWidgets,
};

export default WidgetRegistry;
