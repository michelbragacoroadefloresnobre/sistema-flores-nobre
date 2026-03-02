/* eslint-disable @typescript-eslint/no-unused-vars */
export function getDatePeriodMessage(
  dataInicio?: string,
  dataFim?: string,
): string {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const calculateDaysDifference = (startDate: string) => {
    const start = new Date(startDate);
    const today = new Date();
    start.setHours(0, 0, 0, 0);
    today.setHours(23, 59, 59, 999);
    const diffTime = today.getTime() - start.getTime();
    const diffDays = diffTime / 1000 / 60 / 60 / 24;
    return Math.floor(diffDays);
  };

  if (dataInicio || dataFim) {
    if (dataInicio) {
      const differenceBetweenStartAndToday =
        calculateDaysDifference(dataInicio);
      if (differenceBetweenStartAndToday === 0) return "Formularios de Hoje";
      if (dataFim) {
        if (formatDate(dataInicio) === formatDate(dataFim)) {
          if (differenceBetweenStartAndToday === 1)
            return "Formularios de Ontem";
          return `Formularios do dia ${formatDate(dataInicio)}`;
        }
        if (differenceBetweenStartAndToday === 1)
          return "Formularios desde ontem";

        const differenceBetweenEndAndToday = calculateDaysDifference(dataFim);

        let dataFimFormatada;
        if (!differenceBetweenEndAndToday)
          dataFimFormatada = "Formularios de Hoje";
        else if (differenceBetweenEndAndToday === 1)
          dataFimFormatada = "Formularios de Ontem";
        else dataFimFormatada = formatDate(dataFim);

        return `Formularios entre ${formatDate(dataInicio)} - ${dataFimFormatada}`;
      }
      if (differenceBetweenStartAndToday === 1)
        return "Formularios desde ontem";
      return `Formularios nos últimos ${differenceBetweenStartAndToday} dias`;
    } else return `Formularios antes de ${formatDate(dataFim!)}`;
  }
  return "";
}

export const buildFilters = (filterOptions: Record<string, any>) => {
  const filters = Object.fromEntries(
    Object.entries(filterOptions)
      .map(([key, value]) => {
        if (Array.isArray(value)) {
          if (!value.length) return [key, undefined];
          return [key, value.join(",")];
        } else if (value instanceof Set) {
          if (!value.size) return [key, undefined];
          return [key, Array.from(value).join(",")];
        }
        return [key, value];
      })
      .filter(([_, value]) => {
        if (Array.isArray(value)) return value.length > 0;
        return value;
      }),
  );

  return filters;
};
