const SP = "America/Sao_Paulo";

/** "YYYY-MM-DD" no fuso de São Paulo */
export function spDate(date: Date | string | number): string {
  return new Date(date).toLocaleDateString("sv-SE", { timeZone: SP });
}

/** "YYYY-MM-DDTHH:mm" no fuso de São Paulo — valor para input datetime-local */
export function spDatetimeInput(date: Date | string): string {
  const s = new Date(date).toLocaleString("sv-SE", { timeZone: SP });
  return s.slice(0, 16).replace(" ", "T");
}

/**
 * Converte o valor de um datetime-local (tratado como horário de SP)
 * para uma string ISO UTC.
 * Brasil não tem horário de verão desde 2019 → UTC-3 fixo.
 */
export function spInputToISO(localInput: string): string {
  return new Date(localInput + ":00-03:00").toISOString();
}

/**
 * Converte uma Date UTC para string ISO 8601 com offset SP (-03:00).
 * "2026-05-13T00:49:00.000Z" → "2026-05-12T21:49:00.000-03:00"
 */
export function toSPIso(date: Date | null | undefined): string | null {
  if (date == null) return null;
  const shifted = new Date(date.getTime() - 3 * 60 * 60 * 1000);
  return shifted.toISOString().replace("Z", "-03:00");
}

/**
 * Serializa todos os campos DateTime de um time entry para o fuso SP.
 * Use antes de devolver a resposta JSON nas rotas.
 */
export function serializeEntry<
  T extends {
    date: Date;
    startAt: Date | null;
    endAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    integratedAt: Date | null;
  },
>(entry: T) {
  return {
    ...entry,
    date: toSPIso(entry.date)!,
    startAt: toSPIso(entry.startAt),
    endAt: toSPIso(entry.endAt),
    createdAt: toSPIso(entry.createdAt)!,
    updatedAt: toSPIso(entry.updatedAt)!,
    integratedAt: toSPIso(entry.integratedAt),
  };
}

/**
 * Converte "YYYY-MM-DD" (data SP) para o início desse dia em UTC.
 * Brasil = UTC-3 fixo (sem horário de verão desde 2019).
 */
export function spDayStart(dateStr: string): Date {
  return new Date(dateStr + "T00:00:00-03:00");
}

/**
 * Converte "YYYY-MM-DD" (data SP) para o fim desse dia em UTC (23:59:59.999).
 */
export function spDayEnd(dateStr: string): Date {
  return new Date(dateStr + "T23:59:59.999-03:00");
}

/** Formata uma data no fuso de São Paulo usando Intl */
export function fmtSP(
  date: Date | string,
  opts: Intl.DateTimeFormatOptions
): string {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: SP, ...opts }).format(
    new Date(date)
  );
}
