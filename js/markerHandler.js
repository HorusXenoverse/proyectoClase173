var tableNumber = null
AFRAME.registerComponent("markerhandler",{
    init: async function(){ 
        
        if(tableNumber === null){
            this.alertWelcome()
        }
        var dishes = await this.getDishes()

        this.el.addEventListener("markerFound", ()=>{
            console.log("Marcador encontrado")
            if(tableNumber !== null){
                var markerID = this.el.id
                this.handlerMarkerFound(dishes, markerID)
            }
        })

        this.el.addEventListener("markerLost", ()=>{ 
            console.log("Marcador perdido")
            this.handlerMarkerLost()
        })
    },
    alertWelcome: function(){
        var inconSave = "https://raw.githubusercontent.com/whitehatjr/menu-card-app/main/hunger.png"
        swal({
            title: "Bienvenido a la juguetería",
            icon: inconSave,
            content: {
                element: "input",
                attributes: {
                    placeholder: "Escribe el número de la estantería que quieras",
                    type: "number",
                    min: 1
                }          
            },
            closeOnClickOutside: false
        })
        .then(
            inputValue =>{
                tableNumber = inputValue
            }
        )

    },
    handlerMarkerFound: function(dishes, markerID){
        // Obtener el día
var todaysDate = new Date();
var todaysDay = todaysDate.getDay();

// De domingo a sábado: 0 - 6
var days = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado"
];

var dish = dishes.filter(dish => dish.id === markerID)[0];

if (dish.unavailable_days.includes(days[todaysDay])) {
  swal({
    icon: "warning", 
    title: dish.dish_name.toUpperCase(),
    text: "¡Ese juguete no está disponible hoy!",
    timer: 2500,
    buttons: false
  });
} else {

    var modelChoice = document.querySelector(`#model-${dish.id}`)
    modelChoice.setAttribute("position", dish.model_geometry.position)
    modelChoice.setAttribute("rotation", dish.model_geometry.rotation)
    modelChoice.setAttribute("scale", dish.model_geometry.scale)
    modelChoice.setAttribute("visible", true)

    var ingChoice = document.querySelector(`#plane-${dish.id}`)
    ingChoice.setAttribute("visible", true)

    var priceChoice = document.querySelector(`#price-plane-${dish.id}`)
    priceChoice.setAttribute("visible", true)

    var starsContainer = document.querySelector(`#ratingPlane-${dish.id}`)
    starsContainer.setAttribute("visible", true)
    var feedbackContainer = document.querySelector(`#feedbackPlane-${dish.id}`)
    feedbackContainer.setAttribute("visible", true)

    var buttons = document.getElementById("button-div")
    buttons.style.display = "flex"

    var order_button = document.getElementById("order-button")
    var raiting_button = document.getElementById("raiting-button")
    var orderSummaryButtton = document.getElementById("order-summary-button");
    var payButton = document.getElementById("pay-button")

    if(tableNumber !== null){ 
    order_button.addEventListener("click",()=>{
        var numberTable
        tableNumber <= 9 ?(numberTable = `s0${tableNumber}`) : `s${tableNumber}`
        this.updateDataBase(numberTable, dish)
        swal({
            icon: "https://i.imgur.com/4NZ6uLY.jpg", title: "Gracias por tu pedido", text: "recibirás tu juguete pronto", timer: 2000, buttons: false
        })
    })

    raiting_button.addEventListener("click", function(){
        swal({
            icon: "warning", title: "Calificar servicio", text: "Gracias por calificar"
        })
    })

    order_button.addEventListener("click", () => {
       
        var tNumber;
        
        tableNumber <= 9 ? (tNumber = `s0${tableNumber}`) : `s${tableNumber}`;
     
        this.handleOrder(tNumber, dish);
        
        swal({
          icon: "https://i.imgur.com/4NZ6uLY.jpg",
          title: "¡Gracias por tu orden!",
          text: "¡Recibirás tu juguete pronto!",
          timer: 2000,
          buttons: false
        });
      });

              //2.-Agregar su escucha de evento
              orderSummaryButtton.addEventListener("click", () =>
              this.handleOrderSummary()
            );
      
            payButton.addEventListener("click", ()=>{
              this.alertPay()
            })
    }
  }
},
handleOrder: function (tNumber, dish) {
    
    firebase
      .firestore()
      .collection("estantes")
      .doc(tNumber)
      .get()
      .then(doc => {
        var details = doc.data();


        if (details["current_orders"][dish.id]) {
       
          details["current_orders"][dish.id]["quantity"] += 1;

          var currentQuantity = details["current_orders"][dish.id]["quantity"];

          details["current_orders"][dish.id]["subtotal"] =
            currentQuantity * dish.price;
        } 
        else {
          details["current_orders"][dish.id] = {
            item: dish.nombre,
            price: dish.price,
            quantity: 1,
            subtotal: dish.price * 1
          };
        }
        details.total_bill += dish.price;
        firebase
          .firestore()
          .collection("estantes")
          .doc(doc.id)
          .update(details);
      });
  },
  getDishes: async function () {
    return await firebase
      .firestore()
      .collection("juguetes")
      .get()
      .then(snap => {
        return snap.docs.map(doc => doc.data());
      });
  },
    //3.-Crear funcion para obtener los detalles segun la estantería
    getOrderSummary: async function (tNumber) {
        return await firebase
          .firestore()
          .collection("juguetes")
          .doc(tNumber)
          .get()
          .then(doc => doc.data());
      },
      //4.-Crear función que muestre resumen
  handleOrderSummary: async function () {

    //Obtener el número de mesa
    var tNumber;
    tableNumber <= 9 ? (tNumber = `s0${tableNumber}`) : `s${tableNumber}`;

    //Obtener el resumen del pedido de la base de datos
    var orderSummary = await this.getOrderSummary(tNumber);

    //Cambiar la visibilidad del div modal
    var modalDiv = document.getElementById("modal-div");
    modalDiv.style.display = "flex";

    //Obtener el elemento cuerpo de la tabla
    var tableBodyTag = document.getElementById("bill-table-body");

    //Eliminar datos antiguos de tr(fila de la tabla)
    tableBodyTag.innerHTML = "";

    //Obtener todo lo que tiene el campo current_orders de la mesa elegida
    var currentOrders = Object.keys(orderSummary.current_orders);

    currentOrders.map(i => {

      //Crear la fila de la tabla
      var tr = document.createElement("tr");

      //Crear las columnas de la tabla para NOMBRE DEL ARTÍCULO, PRECIO, CANTIDAD y PRECIO TOTAL
      var item = document.createElement("td");
      var price = document.createElement("td");
      var quantity = document.createElement("td");
      var subtotal = document.createElement("td");

      //Añadir el contenido HTML a las celdas, usando la función innerHTML
      item.innerHTML = orderSummary.current_orders[i].item;

      price.innerHTML = "$" + orderSummary.current_orders[i].price;
      price.setAttribute("class", "text-center");

      quantity.innerHTML = orderSummary.current_orders[i].quantity;
      quantity.setAttribute("class", "text-center");

      subtotal.innerHTML = "$" + orderSummary.current_orders[i].subtotal;
      subtotal.setAttribute("class", "text-center");

      //Añadir las celdas a la fila
      tr.appendChild(item);
      tr.appendChild(price);
      tr.appendChild(quantity);
      tr.appendChild(subtotal);

      //Añadir la fila a la tabla
      tableBodyTag.appendChild(tr);

      var total = document.createElement("tr")
      var colum1 = document.createElement("td")
      var colum2 = document.createElement("td")
      var colum3 = document.createElement("td")

      colum1.setAttribute("class", "no-line")
      colum2.setAttribute("class", "no-line")

      colum3.setAttribute("class", "no-line text-center")
      var textStrong = document.createElement("strong")
      textStrong.innerHTML = "Total"
      colum3.appendChild(textStrong)

      var colum4 = document.createElement("td")
      colum4.setAttribute("class", "no-line text-right")
      colum4.innerHTML = "$"+ orderSummary.total_bill

      total.appendChild(colum1)
      total.appendChild(colum2)
      total.appendChild(colum3)
      total.appendChild(colum4)

      tableBodyTag.appendChild(total)
    });
  },
  
  alertPay: function(){
    document.getElementById("modal-div").style.display = "none"
    var tNumber
    tableNumber <= 9 ? (tNumber = `s0${tableNumber}`) : `s${tableNumber}`

    firebase.firestore()
    .collection("estantes")
    .doc(tNumber)
    .update({
      current_orders: {},
      total_bill: 0
    })
    .then(()=>{
      swal({
        icon : "success",
        title: "Gracias por su compra",
        text: "Regrese pronto",
        timer: 2500,
        buttons: false
      })
    })

  },
   //2.-FUNCIÓN PARA ADMINISTRAR LA CALIFICACIÓN
   handleRatings: async function (dish) {

    // Obtener el número de mesa
    var tNumber
    tableNumber <= 9 ? (tNumber = `s0${tableNumber}`) : `s${tableNumber}`
    
    // Obtener el resumen de la orden desde la base de datos
    var orderSummary = await this.getOrderSummary(tNumber);
    
    //Guardar solo el campo current orders
    var currentOrderSave = Object.keys(orderSummary.current_orders)
   
    //Checar si hay algo guardado en el campo y si esta el id del platillo que se desea calificar
    if(currentOrderSave.length>0 && currentOrderSave == dish.id){
      document.getElementById("rating-modal-div").style.display = "flex"
      document.getElementById("rating-input").value = "0"
      document.getElementById("feedback-input").value = ""

      var sendButton = document.getElementById("save-rating-button")
      sendButton.addEventListener("click", ()=>{
        document.getElementById("rating-modal-div").style.display = "none"

        var saveStars = document.getElementById("rating-input").value
        var saveFeedback = document.getElementById("feedback-input").value

        firebase.firestore()
        .collection("juguetes")
        .doc(dish.id)
        .update({
          last_review: saveFeedback,
          last_rating: saveStars 
        })
        .then(()=>{
          swal({
            icon : "success",
            title: "Gracias por calificar",
            text: "Esperemos hallas disfrutado tu juguete",
            timer: 2500,
            buttons: false
          })
        })
      })
      
    }else{
      swal({
        icon : "warning",
        title: "Ups",
        text: "No se encontró el juguete para dejar clasificación",
        timer: 2500,
        buttons: false
      })

    }
       
  },

updateDataBase: function(tableNumber, dish){
    firebase.firestore()
    .collection("estantes")
    .doc(tableNumber)
    .get()
    .then(
        doc=>{
            var tableDetails = doc.data()
            if(tableDetails["current_orders"][dish.id]){
                tableDetails["current_orders"][dish.id]["quantity"] += 1
                var countOrder = tableDetails["current_orders"][dish.id]["quantity"]
                tableDetails["current_orders"][dish.id]["subtotal"] = countOrder*dish.price
            }else{
                tableDetails["current_orders"][dish.id] = {
                    item: dish.nombre, 
                    price: dish.price,
                    quantity: 1,
                    subtotal: dish.price*1
                }
            }
            tableDetails.total_bill += dish.price
            firebase.firestore()
            .collection("estantes")
            .doc(doc.id)
            .update(tableDetails)
        }
    )

},
    handlerMarkerLost: function(){
        var buttons = document.getElementById("buttons")
        buttons.style.display = "none"
    }
})