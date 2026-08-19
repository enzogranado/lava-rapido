export function computeParkingFee(
  entryTime: Date,
  now: Date,
  hourlyRate: number,
  additionalHourlyRate: number,
  graceMinutes = 15
): { totalMinutes: number; fee: number } {
  const diffMs = Math.max(0, now.getTime() - entryTime.getTime());
  const totalMinutes = Math.ceil(diffMs / (1000 * 60));

  // Tolerância inicial
  if (totalMinutes <= graceMinutes) {
    return { totalMinutes, fee: 0 };
  }

  // 1ª hora (até 60 minutos)
  if (totalMinutes <= 60) {
    return { totalMinutes, fee: hourlyRate };
  }

  // Horas adicionais (ou frações)
  const remainingMinutes = totalMinutes - 60;
  const additionalHours = Math.ceil(remainingMinutes / 60);
  const fee = hourlyRate + additionalHours * additionalHourlyRate;

  return { totalMinutes, fee: Number(fee.toFixed(2)) };
}
