import dayjs from "@/lib/dayjs";
import { parseAsString, useQueryStates } from "nuqs";

const todayVn = () => dayjs().tz("Asia/Ho_Chi_Minh").format("YYYY-MM-DD");

export const useFnbShiftCountQueryConfig = () => {
  const [queryConfig, setQueryConfig] = useQueryStates({
    tab: parseAsString.withDefault("entry"),
    date: parseAsString.withDefault(todayVn()),
    staffId: parseAsString.withDefault(""),
    search: parseAsString.withDefault(""),
    historyFrom: parseAsString.withDefault(""),
    historyTo: parseAsString.withDefault(""),
    historyStaffId: parseAsString.withDefault(""),
  });

  return {
    queryConfig,
    setQueryConfig,
  };
};
