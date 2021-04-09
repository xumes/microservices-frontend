import { Button, Grid, makeStyles, MenuItem, Select } from "@material-ui/core";
import { Loader } from "google-maps";
import { FormEvent, useCallback, useRef, FunctionComponent } from "react";
import { useEffect, useState } from "react";
import { colors } from "../util/colors";
import { getCurrentPosition } from "../util/geolocation";
import { makeCarIcon, makeMarkerIcon, Map } from "../util/map";
import { Route } from '../util/models'
import { sample, shuffle} from 'lodash'
import { useSnackbar } from "notistack";
import { RouteExistsError } from "../errors/route-exists.error";
import { Navbar } from "./Navbar";
import io from 'socket.io-client'

const API_URL = process.env.REACT_APP_API_URL as string;

const googleMapsLoader = new Loader(process.env.REACT_APP_GOOGLE_API_KEY)

const useStyles = makeStyles({
    root: {
      width: "100%",
      height: "100%",
    },
    form: {
      margin: "16px",
    },
    btnSubmitWrapper: {
      textAlign: "center",
      marginTop: "8px",
    },
    map: {
      width: "100%",
      height: "100%",
    },
  });

export const Mapping: FunctionComponent = ( ) => {
    const classes = useStyles()
    const [routes, setRoutes] = useState<Route[]>([])
    const [routeIdSelected, setRouteIdSelected] = useState<string>('')
    const mapRef = useRef<Map>()
    const socketIORef = useRef<SocketIOClient.Socket>()
    const { enqueueSnackbar} = useSnackbar()

    const finishRoute = useCallback(
      (route: Route) => {
        enqueueSnackbar(`${route.title} has delivered!`, {
          variant: "success",
        });
        mapRef.current?.removeRoute(route._id);
      },
      [enqueueSnackbar]
    );

    useEffect(() => {
      if (!socketIORef.current?.connected) {
        socketIORef.current = io.connect(API_URL);
        socketIORef.current.on("connect", () => console.log("socket has been reconnected!!!"));
      }

      const handler = (data: {
        routeId: string;
        position: [number, number];
        finished: boolean;
      }) => {
        console.log(data);
        mapRef.current?.moveCurrentMarker(data.routeId, {
          lat: data.position[0],
          lng: data.position[1],
        });
        const route = routes.find((route) => route._id === data.routeId) as Route;
        if (data.finished) {
          finishRoute(route);
        }
      };
      socketIORef.current?.on("new-position", handler);
      return () => {
        socketIORef.current?.off("new-position", handler);
      };
    }, [finishRoute, routes, routeIdSelected]);

    useEffect(() => {
      socketIORef.current = io.connect(`${API_URL}`)
      socketIORef.current.on('connect', () => console.log('socket is connected'))
    }, [])

    useEffect(() => {
        fetch(`${API_URL}/routes`)
            .then(data => data.json())
            .then(data => setRoutes(data));
    }, [])

    useEffect(() => {
        (async () => {
            const [, position] = await Promise.all([
                googleMapsLoader.load(),
                getCurrentPosition({enableHighAccuracy: true})
            ])
            const divMap = document.getElementById('map') as HTMLElement
            mapRef.current = new Map(divMap, {
                zoom: 15,
                center: position
            })
        })()
    }, [])

    const startRoute = useCallback((event: FormEvent) => {
        event.preventDefault();
        const route = routes.find((route) => route._id === routeIdSelected)
        const color = sample(shuffle(colors)) as string

        try {
            mapRef.current?.addRoute(routeIdSelected, {
              currentMarkerOptions: {
                position: route?.startPosition,
                icon: makeCarIcon(color),
              },
              endMarkerOptions: {
                position: route?.endPosition,
                icon: makeMarkerIcon(color),
              },
            });
            socketIORef.current?.emit('new-direction', {
              routeId: routeIdSelected
            })
          } catch (error) {
            if (error instanceof RouteExistsError) {
              enqueueSnackbar(`${route?.title} has already been started. Wait for delivery.`, {
                variant: "error",
              });
              return;
            }
            throw error;
          }
        },
        [routeIdSelected, routes, enqueueSnackbar]
      );

    return (
        <Grid container className={classes.root}>
            <Grid item xs={12} sm={3}>
                <Navbar />
                <form onSubmit={startRoute} className={classes.form}>
                    <Select fullWidth displayEmpty value={routeIdSelected} onChange={(event) => setRouteIdSelected(event.target.value + "")}>
                        <MenuItem value="">
                            <em>Choose a delivery</em>
                        </MenuItem>

                        {routes?.map((route, key) => <MenuItem value={route._id} key={key}>
                                {route.title}
                            </MenuItem>
                        )}

                    </Select>
                    <div className={classes.btnSubmitWrapper}>
                        <Button type="submit" color="primary" variant="contained">Start a delivery</Button>
                    </div>
                </form>
            </Grid>
            <Grid item xs={12} sm={9}>
                <div id="map" className={classes.map}></div>
            </Grid>
        </Grid>
    );
};
