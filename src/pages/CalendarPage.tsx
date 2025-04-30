import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CustomCalendar } from "@/components/ui/custom-calendar";
import holidayApis from "@/apis/holiday.apis";
import { Spin } from "@/components/ui/spin";

interface Holiday {
  _id?: string;
  date: string;
  name: string;
  description?: string;
}

function CalendarPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch holidays
  const { data: holidays, isLoading } = useQuery({
    queryKey: ["holidays"],
    queryFn: holidayApis.getHolidays,
  });

  const events = holidays?.result;

  // Add holiday
  const addHolidayMutation = useMutation({
    mutationFn: holidayApis.addHoliday,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["holidays"] });
      toast({
        title: "Success",
        description: "Holiday added successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add holiday",
        variant: "destructive",
      });
    },
  });

  // Delete holiday
  const deleteHolidayMutation = useMutation({
    mutationFn: holidayApis.deleteHoliday,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["holidays"] });
      toast({
        title: "Success",
        description: "Holiday deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete holiday",
        variant: "destructive",
      });
    },
  });

  const handleAddEvent = (event: Holiday) => {
    addHolidayMutation.mutate(event);
  };

  const handleDeleteEvent = (event: Holiday) => {
    if (event._id) {
      deleteHolidayMutation.mutate(event._id);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <Spin spinning={isLoading}>
        <Card>
          <CardHeader>
            <h1 className="text-2xl font-bold">Holiday Calendar</h1>
          </CardHeader>
          <CardContent>
            <CustomCalendar
              events={events}
              onEventAdd={handleAddEvent}
              onEventDelete={handleDeleteEvent}
            />
          </CardContent>
        </Card>
      </Spin>
    </div>
  );
}

export default CalendarPage;
