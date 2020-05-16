ymaps.ready(init);

function addCode(Distance) {

    Distance = Distance / 1000;
    document.getElementById("add_to_me").innerHTML +=
        "<h3>Длина маршрута: "+Distance.toFixed(1)+" км</h3>";

    var price=400+Distance*30;
    document.getElementById("add_to_me").innerHTML +=
        "<h3>Стоимость доставки: "+price.toFixed(1)+" руб.</h3>";

}

function init() {
    var myMap = new ymaps.Map("map", {
            center: [55.73, 37.75],
            zoom: 9
        }, {
            searchControlProvider: 'yandex#search'
        }),
        moscowPolygon;

    document.getElementsByClassName("otchet").innerHTML +=
        "<h3>This is the text which has been inserted by JS</h3>";

    function onPolygonLoad (json) {
        moscowPolygon = new ymaps.Polygon(json.coordinates);
        // Если мы не хотим, чтобы контур был виден, зададим соответствующую опцию.
        moscowPolygon.options.set({fillColor: "ffffff00",strokeWidth: 2 ,strokeColor: "ff0000aa" });
        // Чтобы корректно осуществлялись геометрические операции
        // над спроецированным многоугольником, его нужно добавить на карту.
        myMap.geoObjects.add(moscowPolygon);

        console.log('Poligon created');

        ymaps.route(['Москва', 'Зеленоград']).then(
            function (res) {
                // Объединим в выборку все сегменты маршрута.
                var pathsObjects = ymaps.geoQuery(res.getPaths()),
                    edges = [];

                var PathLength=0;


                var PathLength=7.4;
                console.log('Length',PathLength);

                // Переберем все сегменты и разобьем их на отрезки.
                pathsObjects.each(function (path) {
                    var coordinates = path.geometry.getCoordinates();
                    for (var i = 1, l = coordinates.length; i < l; i++) {
                        edges.push({
                            type: 'LineString',
                            coordinates: [coordinates[i], coordinates[i - 1]]
                        });
                    }
                });

                // Создадим новую выборку, содержащую:
                // - отрезки, описываюшие маршрут;
                // - начальную и конечную точки;
                // - промежуточные точки.
                var routeObjects = ymaps.geoQuery(edges)
                        .add(res.getWayPoints())
                        .add(res.getViaPoints())
                        .setOptions('strokeWidth', 3)
                        .addToMap(myMap),
                    // Найдем все объекты, попадающие внутрь МКАД.
                    objectsInMoscow = routeObjects.searchInside(moscowPolygon),
                    // Найдем объекты, пересекающие МКАД.
                    boundaryObjects = routeObjects.searchIntersect(moscowPolygon);

                // Раскрасим в разные цвета объекты внутри, снаружи и пересекающие МКАД.
                boundaryObjects.setOptions({
                    strokeColor: '#06ff00',
                    //preset: 'islands#greenIcon'

                });

                objectsInMoscow.setOptions({
                    strokeColor: '#ffffff',
                    visible: false
                    //preset: 'islands#redIcon'
                });

                // Объекты за пределами МКАД получим исключением полученных выборок из
                // исходной.
                routeObjects.remove(objectsInMoscow).remove(boundaryObjects).setOptions({
                    strokeColor: '#0010ff',
                    preset: 'islands#blueIcon'
                });

                var MKADDistance = 0;
                var insideMKADDistance = 0;
//объекты "минус" то, что внутри
//a-b
                routeObjects.remove(objectsInMoscow).remove(boundaryObjects)
                    .each(function (segment, i)
                    {
                        //есть ли такая фунция
                        if (segment.geometry.getDistance != undefined)
                            MKADDistance += segment.geometry.getDistance();
                    });

//то, что внутри
//это как a-(a-b)=b
                routeObjects.remove(routeObjects.remove(objectsInMoscow).remove(boundaryObjects))
                    .each(function (segment, i)
                    {
                        if (segment.geometry.getDistance != undefined)
                            insideMKADDistance += segment.geometry.getDistance();
                    });

                console.log('insideMKADDistance',insideMKADDistance);

                console.log('MKADDistance',MKADDistance);

                addCode(MKADDistance);


            }
        );
    }

    $.ajax({
        url: 'moscow.json',
        dataType: 'json',
        success: onPolygonLoad
    });
}
