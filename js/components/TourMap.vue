<template>
    <div class="map-container h-100">
        <div class="h-100" ref="map"></div>
    </div>
</template>

<script>
import { mapGetters, mapState } from 'vuex';
import Geocoding from '../mixins/Geocoding';
var MarkerWithLabel = require('markerwithlabel')(google.maps);

export default {
    mixins: [ Geocoding ],
    
    data: () => ({
        map: {},
        tourMarker: { pin: null },
        routeLine: {},
        markers: [],
    }),

    computed: {
        ...mapGetters({
            tour: 'tours/current',
            stop: 'tours/currentStop',
            routes: 'routes/current',
            routeMode: 'routes/mode',
            nextStopOrder: 'tours/getNextStopOrder',
        }),
        ...mapState({
            cursor: state => state.map.cursor,
        }),
        allMarkers() {
            if (this.tourMarker != null) {
                return [...this.markers, this.tourMarker];
            }
            return [...this.markers];
        },

        tourLocation() {
            if (this.objHasCoordinates(this.tour.location)) {
                return {
                    lat: parseFloat(this.tour.location.latitude),
                    lng: parseFloat(this.tour.location.longitude),
                };
            }

            return false;
        },

        pinIcon() {
            if (! this.tour.pin_image_id) {
                return null;
            }

            return {
                url: this.tour.pin_image.icon_path,
                size: new google.maps.Size(48, 48),
                scaledSize: new google.maps.Size(48, 48),
                // labelOrigin: new google.maps.Point(24, -5),
            }
        },
    },

    methods: {
        loadTourMarker() {
            if (this.tourMarker.pin) {
                this.tourMarker.pin.setMap(null);
                this.tourMarker = { pin: null, radius: null };
            }
            
            if (this.tourLocation) {
                this.tourMarker.pin = new MarkerWithLabel({
                    position: this.tourLocation,
                    map: this.map,
                    title: 'Junket Location',
                    // label: 'A',
                    icon: this.pinIcon,
                    labelAnchor: new google.maps.Point(13, 68),
                    labelClass: "pin_label", // the CSS class for the label
                    labelContent: 'T',
                    // icon: 'https://developers.google.com/maps/documentation/javascript/examples/full/images/beachflag.png',
                });

                this.tourMarker.pin.addListener('click', e => {
                    this.onClickTourMarker(e);
                });
            }
        },

        clearMarkers() {
            this.markers.forEach(item => {
                if (item) {
                    if (item.pin) {
                        item.pin.setMap(null);
                    }
                    if (item.radius) {
                        item.radius.setMap(null);
                    }
                }
            });
            this.markers.length = 0;
        },

        loadStopMarkers() {
            this.clearMarkers();
            
            this.tour.stops.forEach(item => {
                let m = null;

                if (item.id == this.stop.id && this.objHasCoordinates(this.stop.location)) {
                    // draw from current stop object so it reflect the live form data
                    this.createMarker(this.stop, true);
                } else if (this.objHasCoordinates(item.location)) {
                    // draw from object in stop list
                    this.createMarker(item);
                } else {
                    console.log(item);
                    return;
                }
            });

            // load a temp marker if the create form has a location
            if (! this.stop.id && this.objHasCoordinates(this.stop.location)) {
                this.createMarker(this.stop, true);
            }

            if (this.routeMode == 'hide') {
                this.showStopRadi();
            }
        },
        
        /**
         * Display blue radius circle around all stop markers.
         */
        showStopRadi() {
            this.markers.forEach(marker => {
                let stop = this.$store.getters['tours/getStopFromid'](marker.id)
                if (! stop) {
                    return;
                }

                marker.radius = new google.maps.Circle({
                    map: this.map,
                    radius: stop.play_radius ? parseFloat(stop.play_radius) : 0,  // in metres
                    fillColor: '#0099ff',
                    fillOpacity: 0.40,
                    strokeWeight: 1,
                });
                marker.radius.bindTo('center', marker.pin, 'position');
            });
        },

        /**
         * Hide all the stop radi on the map.
         */
        hideStopRadi() {
            this.markers.forEach(marker => {
                if (marker.radius) {
                    marker.radius.setMap(null);
                    marker.radius = null;
                }
            });
        },

        /**
         * Get stop by ID
         */
        findStop(id) {
            let index = this.markers.find(obj => obj.id == id);
            if (index >= 0) {
                return this.markers[index];
            }

            return null;
        },

        createMarker(stop, isCurrent = false) {
            let marker = {
                radius: null,
                pin: null,
                id: stop.id,
            };

            marker.pin = new MarkerWithLabel({
                map: this.map,
                title: stop.title,
                // label: String(stop.order),
                position: { lat: parseFloat(stop.location.latitude), lng: parseFloat(stop.location.longitude) },
                icon: this.pinIcon,
                labelAnchor: new google.maps.Point(13, 68),
                labelClass: isCurrent ? "pin_label_active" : "pin_label", // the CSS class for the label
                labelContent: String(stop.order ? stop.order : this.nextStopOrder),
                draggable: isCurrent,
            });

            marker.pin.addListener('click', () => {
                this.onClickMarker(marker.pin, stop);
            });

            marker.pin.addListener('dragend', (e) => {
                this.onDragMarker(e, marker.pin, stop);
            });

            this.markers.push(marker);
        },

        zoomToFitMarkers(initial = false) {
            let markers = this.allMarkers;
            if (markers.length) {
                let bounds = new google.maps.LatLngBounds();
                for (var i = 0; i < markers.length; i++) {
                    if (markers[i].pin) {
                        bounds.extend(markers[i].pin.getPosition());
                    }
                }

                if (initial) {
                    google.maps.event.addListener(this.map, 'idle', () => {
                        this.map.fitBounds(bounds);
                        google.maps.event.clearListeners(this.map, 'idle');
                    });
                } else {
                    this.map.fitBounds(bounds);
                }
            } else {
                console.log("no markers?");
            }
        },

        initMap(element) {
            // center over the usa
            let defaultPosition = { zoom: 4, center: {lat: 39.0, lng: -93.0} };

            // center over tour
            if (this.tourLocation) {
                defaultPosition = { zoom: 12, center: this.tourLocation };
            }

            this.map = new google.maps.Map(element, defaultPosition);
            google.maps.event.addListener(this.map, "click", this.onClickMap);

            this.loadTourMarker();
            this.loadStopMarkers();
            this.zoomToFitMarkers(true);
            this.drawRoutes();
        },

        onClickTourMarker(event) {
            if (this.routeMode == 'edit') {
                this.$store.commit('routes/add', {
                    lng: event.latLng.lng(),
                    lat: event.latLng.lat(),
                });
                return;
            }
            this.$emit('clickTour');
        },

        onClickMarker(marker, stop) {
            if (this.routeMode == 'edit') {
                this.$store.commit('routes/add', {
                    lat: stop.location.latitude,
                    lng: stop.location.longitude,
                });
                return;
            }

            if (stop.id != this.stop.id) {
                this.$emit('clickStop', stop.id);
            }
        },

        async onDragMarker(event, marker, stop) {
            this.$store.commit('map/setDraggedMarker', {
                latLng: {
                    lat: event.latLng.lat(),
                    lng: event.latLng.lng(),
                },
                stop,
            })
        },

        onClickMap(event) {
            if (this.routeMode == 'edit') {
                this.$store.commit('routes/add', {
                    lng: event.latLng.lng(),
                    lat: event.latLng.lat(),
                });
                return;
            }

            this.$store.commit('map/setClickedPoint', {
                latitude: event.latLng.lat(),
                longitude: event.latLng.lng(),
            });
        },

        drawRoutes() {
            if (this.routeLine) {
                // google.maps.event.clearListeners(this.routeLine, 'dragend');
            }

            this.routeLine = new google.maps.Polyline({
                path: this.routes,
                geodesic: true,
                strokeColor: '#0099ff',
                strokeOpacity: 0.75,
                strokeWeight: 5,
                editable: true,
            });

            google.maps.event.addListener(this.routeLine, "dragend", this.updateRoutes);
            google.maps.event.addListener(this.routeLine.getPath(), "insert_at", this.updateRoutes);
            google.maps.event.addListener(this.routeLine.getPath(), "remove_at", this.updateRoutes);
            google.maps.event.addListener(this.routeLine.getPath(), "set_at", this.updateRoutes);

            this.routeLine.setMap(this.map);
        },

        updateRoutes() {
            if (this.formViewMode != 'tour' && this.tour.type == 'outdoor') {
                this.$emit('clickTour');
            }

            if (this.routeMode != 'edit') {
                this.$store.commit('routes/startEditing');
            }

            var path = this.routeLine.getPath();
            var len = path.getLength();
            var coordStr = "";

            let routes = [];
            for (var i = 0; i < len; i++) {
                routes.push({ lat: path.getAt(i).lat(), lng: path.getAt(i).lng() });
            }

            this.$store.commit('routes/setCurrent', routes);
            // this.routes = this.routeLine.getPath();
        },
    },

    mounted() {
        this.initMap(this.$refs.map);
    },

    watch: {
        routeMode(newVal) {
            if (newVal == 'hide') {
                this.showStopRadi();
            } else {
                this.hideStopRadi();
            }
        },

        routes(newVal, oldVal) {
            console.log('tourmap: routes object changed (watch)');
            this.routeLine.setPath(newVal);
     
            google.maps.event.clearListeners(this.routeLine.getPath(), 'insert_at');
            google.maps.event.clearListeners(this.routeLine.getPath(), 'remove_at');
            google.maps.event.clearListeners(this.routeLine.getPath(), 'set_at');
            google.maps.event.addListener(this.routeLine.getPath(), "insert_at", this.updateRoutes);
            google.maps.event.addListener(this.routeLine.getPath(), "remove_at", this.updateRoutes);
            google.maps.event.addListener(this.routeLine.getPath(), "set_at", this.updateRoutes);
            // var path = this.routeLine.getPath();
            // path.push(event.latLng);
        },

        tour(newVal, oldVal) {
            console.log('tour changed');
            this.loadTourMarker();
            this.loadStopMarkers();
            this.zoomToFitMarkers();

            // show route if outdoor tour
            if (this.tour.type == 'outdoor') {
                this.$store.commit('routes/show', this.tour.route);
            }
            
            // reload map when tour is changed
            if (newVal.id && newVal.id != oldVal.id) {
                this.initMap(this.$refs.map);
            }
        },

        stop(newVal, oldVal) {
            this.loadStopMarkers();
            this.zoomToFitMarkers();
        },

        cursor(newVal, oldVal) {
            console.log('cusor changed: ' + newVal);
            this.map.setOptions({draggableCursor: newVal});
        },
    },
}
</script>

<style>
.pin_label {
    background-color: #fff;
    border: 1px solid #9e9e9e;
    padding: 2px 4px;
    border-radius: 20px;
    color: #000;
    font-size: 13px;
    width: 25px;
    text-align: center;
}
.pin_label_active {
    background-color: #ff5050;
    border: 1px solid #9e9e9e;
    padding: 2px 4px;
    border-radius: 20px;
    color: #fff;
    font-size: 13px;
    width: 25px;
    text-align: center;
}
</style>