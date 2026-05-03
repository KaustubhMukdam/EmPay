from dataclasses import dataclass


@dataclass
class PayslipResult:
    basic: float
    hra: float
    other_allowances: float
    gross: float
    pf_deduction: float
    prof_tax: float
    leave_deduction: float
    net_pay: float


def calculate_payslip(
    basic: float,
    hra: float,
    other_allowances: float,
    pf_rate: float,           # e.g. 0.12 for 12%
    prof_tax: float,          # e.g. 200.0 flat monthly
    total_working_days: int,  # calendar working days in the month
    unpaid_leave_days: int,   # days to deduct
) -> PayslipResult:
    """
    Core payroll calculation engine.
    Formula:
        Gross = Basic + HRA + Other Allowances
        PF = Basic × pf_rate
        PerDaySalary = Basic / total_working_days
        LeaveDeduction = PerDaySalary × unpaid_leave_days
        NetPay = Gross - PF - ProfTax - LeaveDeduction
    """
    gross = basic + hra + other_allowances
    pf_deduction = round(basic * pf_rate, 2)
    
    # Standard practice: Leave deduction is based on Gross Salary
    per_day_gross = gross / total_working_days if total_working_days > 0 else 0.0
    leave_deduction = round(per_day_gross * unpaid_leave_days, 2)
    
    # Calculate Net Pay and ensure it doesn't go below zero
    net_pay_raw = gross - pf_deduction - prof_tax - leave_deduction
    net_pay = round(max(0, net_pay_raw), 2)

    return PayslipResult(
        basic=basic,
        hra=hra,
        other_allowances=other_allowances,
        gross=round(gross, 2),
        pf_deduction=pf_deduction,
        prof_tax=prof_tax,
        leave_deduction=leave_deduction,
        net_pay=net_pay,
    )
