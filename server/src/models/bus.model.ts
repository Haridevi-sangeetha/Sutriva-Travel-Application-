export interface IBusStop {
  stopId: string;
  stopName: string;
  latitude: number;
  longitude: number;
  arrivalTime: string;
  departureTime: string;
}

export interface IBusRoute {
  _id: string;
  operator: string;
  routeId: string;
  routeNumber: string;
  routeName: string;
  stops: IBusStop[];
  source?: string;
  verified?: boolean;
}

export interface IEnrichedBusRoute extends IBusRoute {
  totalStops: number;
  originStop: string;
  destinationStop: string;
  startTime: string;
  endTime: string;
  estimatedDuration: string;
  estimatedFare: string;
  serviceType: string;
}
