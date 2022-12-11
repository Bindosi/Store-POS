let cart = [];
let salesItems = [];
let index = 0;
let allUsers = [];
let allProducts = [];
let displayProducts = [];
let allCategories = [];
let allCategoriesitemCount = [];
let allTransactions = [];
let sold = [];
let state = [];
let sold_items = [];
let item;
let salesItem;
let auth;
let holdOrder = 0;
let vat = 0;
let perms = null;
let deleteId = 0;
let paymentType = 0;
let receipt = '';
let totalVat = 0;
let subTotal = 0;
let method = '';
let order_index = 0;
let user_index = 0;
let product_index = 0;
let transaction_index;
let host = 'localhost';
const QRCode = require('qrcode');
let path = require('path');
let port = '8001';
let moment = require('moment');
let Swal = require('sweetalert2');
let { ipcRenderer } = require('electron');
const  net  = require('electron');
let dotInterval = setInterval(function () { $(".dot").text('.') }, 3000);
let Store = require('electron-store');
const remote = require('electron').remote;
const app = remote.app;
let img_path = app.getPath('appData') + '/POS/uploads/';
let api = 'http://' + host + ':' + port + '/api/';
let btoa = require('btoa');
let jsPDF = require('jspdf');
let html2canvas = require('html2canvas');
let JsBarcode = require('jsbarcode');
let macaddress = require('macaddress');
const { forEach } = require("async");
const multer = require("multer");
var internetAvailable = require("internet-available");
let categories = [];
let holdOrderList = [];
let customerOrderList = [];
let ownUserEdit = null;
let totalPrice = 0;
let orderTotal = 0;
let auth_error = 'Incorrect username or password';
let auth_empty = 'Please enter a username and password';
let holdOrderlocation = $("#randerHoldOrders");
let customerOrderLocation = $("#randerCustomerOrders");
let storage = new Store();
let settings;
let platform;
let user = {};
let start = moment().startOf('month');
let end = moment();
let start_date = moment(start).toDate();
let end_date = moment(end).toDate();
let by_till = 0;
let by_user = 0;
let by_status = 1;
let by_category = 0;
let network_status = 'Online';
const BSON = require('bson')
var Readable = require('stream').Readable;
var Writeable = require('stream').Writable;
$('#deleteAllTransactions').hide();
$('#categorysales').hide();
$('#sold_categories_view').hide();
$('#Categories_view').hide();
$('#Products_view').hide();
$("#product_search_view").hide();

var stream = new Readable;
var writableStream = new Readable;
stream.setEncoding('UTF8');




const excelToJson = require('convert-excel-to-json');

$(function () {

    function cb(start, end) {
        $('#reportrange span').html(start.format('MMMM D, YYYY') + '  -  ' + end.format('MMMM D, YYYY'));
    }

    $('#reportrange').daterangepicker({
        startDate: start,
        endDate: end,
        autoApply: true,
        timePicker: true,
        timePicker24Hour: true,
        timePickerIncrement: 10,
        timePickerSeconds: true,
        // minDate: '',
        ranges: {
            'Today': [moment().startOf('day'), moment()],
            'Yesterday': [moment().subtract(1, 'days').startOf('day'), moment().subtract(1, 'days').endOf('day')],
            'Last 7 Days': [moment().subtract(6, 'days').startOf('day'), moment().endOf('day')],
            'Last 30 Days': [moment().subtract(29, 'days').startOf('day'), moment().endOf('day')],
            'This Month': [moment().startOf('month'), moment().endOf('month')],
            'This Month': [moment().startOf('month'), moment()],
            'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
        }
    }, cb);

    cb(start, end);

});
const updateOnlineStatus = () => {
    if(navigator.onLine){
        document.getElementById('onlineStatusIndicator').className ='btn btn-default waves-effect waves-light'
        document.getElementById('onlineStatus').innerHTML ='Online';
        network_status = 'Online';
    }else {
        document.getElementById('onlineStatusIndicator').className ='btn btn-danger waves-effect waves-light'
        document.getElementById('onlineStatus').innerHTML ='Offline';
        network_status = 'Offline';
    };
}
console.log('this is the current status of network'+ network_status);
window.addEventListener('Online', updateOnlineStatus)
window.addEventListener('Offline', updateOnlineStatus)

updateOnlineStatus();




$.fn.serializeObject = function () {
    var o = {};
    var a = this.serializeArray();
    $.each(a, function () {
        if (o[this.name]) {
            if (!o[this.name].push) {
                o[this.name] = [o[this.name]];
            }
            o[this.name].push(this.value || '');
        } else {
            o[this.name] = this.value || '';
        }
    });
    return o;
};


auth = storage.get('auth');
user = storage.get('user');


if (auth == undefined) {
    $.get(api + 'users/check/', function (data) { });
    $("#loading").show();
    authenticate();

} else {

    $('#loading').show();

    setTimeout(function () {
        $('#loading').hide();
    }, 2000);

    platform = storage.get('settings');

    if (platform != undefined) {

        if (platform.app == 'Network Point of Sale Terminal') {
            api = 'http://' + platform.ip + ':' + port + '/api/';
            perms = true;
        }
    }

    $.get(api + 'users/user/' + user._id, function (data) {
        user = data;
        $('#loggedin-user').text(user.fullname);
    });


    $.get(api + 'settings/get', function (data) {
        settings = data.settings;
    });


    $.get(api + 'users/all', function (users) {
        allUsers = [...users];
    });



    $(document).ready( async function () {

        $(".loading").hide();
    $('#showAllTransactions').hide();

        loadCategories();
       await loadAllProducts() 
        loadProducts();
        loadCustomers();


        if (settings && settings.symbol) {
            $("#price_curr, #payment_curr, #change_curr").text(settings.symbol);
        }


        setTimeout(function () {
            if (settings == undefined && auth != undefined) {
                $('#settingsModal').modal('show');
            }
            else {
                vat = parseFloat(settings.percentage);
                $("#taxInfo").text(settings.charge_tax ? vat : 0);
            }

        }, 1500);



        $("#settingsModal").on("hide.bs.modal", function () {

            setTimeout(function () {
                if (settings == undefined && auth != undefined) {
                    $('#settingsModal').modal('show');
                }
            }, 1000);

        });


        if (0 == user.perm_products) { $(".p_one").hide() };
        if (0 == user.perm_categories) { $(".p_two").hide() };
        if (0 == user.perm_transactions) { $(".p_three").hide() };
        if (0 == user.perm_settings) { $(".p_delete").hide() };
        if (0 == user.perm_settings) { $('#totals ').hide() };
       // if (0 == user.perm_settings) { $('#sold_categories_view').hide() };
        if (0 == user.perm_settings) { $('#product_sales_row').hide() };
        if (0 == user.perm_users) { $(".p_four").hide() };
        if (0 == user.perm_settings) { $(".p_five").hide() };
     
     async  function loadAllProducts() {

            $.get(api + 'inventory/products/all', function (data) {
                
               
                data.forEach(item => {
                let  price = parseFloat(item.price);
                     item.price = numberWithCommas(price);
                });

                allProducts = [...data];

                // allProducts.forEach((product, index)=>{
                //     allCategories.forEach((thiscategory,index)=>{
                //         if(product.category == thiscategory._id){
                //             itemscount++
                //         }
                //     })
                // })
            //    console.log('this are all products'+allProducts);
            });

        }

     function loadProducts() {

            $.get(api + 'inventory/products', function (data) {
                
               
                data.forEach(item => {
                let  price = parseFloat(item.price);
                     item.price = numberWithCommas(price);
                });


                displayProducts = [...data];

         //       console.log('these are the products'+ JSON.stringify(displayProducts))
               // loadProductList();

                $('#parent').text('');
                $('#categories').html(`<button type="button" id="all" class="btn btn-categories btn-white waves-effect waves-light">All</button> `);
           
            
                
                    data.forEach(item => {

                    if (!categories.includes(item.category)) {
                        categories.push(item.category);
                    }
                    console.log('this point reached')
                    let item_info = `<div class="col-lg-3 box ${item.category}"
                                onclick="$(this).addToCart(${item.barcode}, ${item.quantity},${item.stock})">
                            <div class="widget-panel widget-style-2 ">                    
                                        <div class="text-muted m-t-5 text-center">
                                        <div class="name" id="itemName">${item.name}</div> 
                                        <span class="sku">${item.barcode}</span>
                                        <sp class="text-success text-center"><b data-plugin="counterup">${settings.symbol + " "+ numberWithCommas(item.price)}</b> </sp>
                            </div>
                        </div>`;
                    $('#parent').append(item_info);
                });
            });
        }

                
    function searchProducts() {    
        console.log('search function is invoked');
       
        $("#categories .btn-categories").removeClass("active");
    
       if($("#search").val().length > 1){
    
           let searchQuery = $("#search").val();
    
               $.get(api + 'inventory/search/'+searchQuery, function (data) {
                   console.log('this are the searched item'+JSON.stringify(data))
                  console.log('this is the data'+ data)
                   data.forEach(item => {
                   let  price = parseFloat(item.price);
                        item.price = numberWithCommas(price);
                   });
    
                   $('#parent').text('');
                   $('#categories').html(`<button type="button" id="all" class="btn btn-categories btn-white waves-effect waves-light">All</button> `);
              
               
                   
                       data.forEach(item => {
    
                       if (!categories.includes(item.category)) {
                           categories.push(item.category);
                       }
                      
                       let item_info = `<div class="col-sm
                       
                       -3 box ${item.category}"
                                   onclick="$(this).addToCart(${item.barcode}, ${item.quantity},${item.stock})">
                               <div class="widget-panel widget-style-2 ">                    
                                           <div class="text-muted m-t-5 text-center">
                                           <div class="name" id="itemName">${item.name}</div> 
                                           <span class="sku">${item.barcode}</span>
                                           <sp class="text-success text-center"><b data-plugin="counterup">${settings.symbol + " "+ numberWithCommas(item.price)}</b> </sp>
                               </div>
                           </div>`;
                       $('#parent').append(item_info);
    
                   });
    
                
           
                //    categories.forEach(category => {
    
                //        let c = allCategories.filter(function (ctg) {
                //            return ctg._id == category;
                //        })
    
                //        $('#categories').append(`<button type="button" id="${category}" class="btn btn-categories btn-white waves-effect waves-light">${c.length > 0 ? c[0].name : ''}</button> `);
                //    });
    
               });
    
           
               
           }
    
       }

       
    
       
       let $search = $("#search").on('input', function(){
            searchProducts();       
       });

function searchSingleProduct() {    
    
    let single_product_info = ''
    console.log('single search function is invoked');
       
        $("#categories .btn-categories").removeClass("active");
    
       if($("#searchSingleProduct").val().length > 2){
        $('#productParent').empty();
      //  $('#searchProductList').DataTable().destroy();
    
           let searchQuery = $("#searchSingleProduct").val();
    
               $.get(api + 'inventory/search/'+searchQuery, function (data) {
                //    console.log('this are the searched item'+JSON.stringify(data))
                //   console.log('this is the data'+ data)
                   data.forEach(item => {
                   let  price = parseFloat(item.price);
                        item.price = numberWithCommas(price);
                   });
    
                   $('#productParent').text('');
                   $('#categories').html(`<button type="button" id="all" class="btn btn-categories btn-white waves-effect waves-light">All</button> `);
              
               
                   
                       data.forEach((item, index) => {
    
                       if (!categories.includes(item.category)) {
                           categories.push(item.category);
                       }

                       let category = allCategories.filter(function (category) {
                        return category._id == item.category;
                    });
           let itemID = item._id;
                  single_product_info += `<tr>
                       <td>${item.barcode}</td>
                       <!--td><img style="max-height: 50px; max-width: 30px; border: 1px solid #ddd;" src="${item.img == "" ? "./assets/images/default.jpg" : img_path + item.img}" id="product_img"></td-->
                       <td>${item.name}</td>
                       <td>${settings.symbol}${item.price}</td>
                       <td>${item.stock}</td>
                       <td>${item.quantity}</td>
                       <td>${category.length > 0 ? category[0].name : ''}</td>
                       <td class="nobr"><span class="btn-group"><button onClick="$(this).editProductUsingId('${itemID}')" class="btn btn-warning btn-sm"><i class="fa fa-edit"></i></button><button onClick="$(this).deleteProduct(${item._id})" class="btn btn-danger btn-sm"><i class="fa fa-trash"></i></button></span></td></tr>`;
                    //   $('#productParent').append(single_product_info);
                       $('#productParent').html(single_product_info);  
                   });

               });  
           }
       }

 let $searchSingleProduct = $("#searchSingleProduct").on('input', function(){
        searchSingleProduct();       
   });

    $('body').on('click', '#jq-keyboard button', async function(e) {
        if($("#search").is(":focus")) {
           searchProducts(); 
        }          
    });

        function loadCategories() {
            $.get(api + 'categories/all', function (data) {
                allCategories = data;
                loadCategoryList();
                $('#category').html(`<option value="0">Select</option>`);
                $('#categorieSearch').html(`<option value="0">Select</option>`);
                allCategories.forEach(category => {
                    $('#category').append(`<option value="${category._id}">${category.name}</option>`);
                    $('#categorieSearch').append(`<option value="${category._id}">${category.name}</option>`);
                });
            });
        }


        function loadCustomers() {

            $.get(api + 'customers/all', function (customers) {

                $('#customer').html(`<option value="0" selected="selected">Walk in customer</option>`);

                customers.forEach(cust => {

                    let customer = `<option value='{"id": ${cust._id}, "name": "${cust.name}"}'>${cust.name}</option>`;
                    $('#customer').append(customer);
                });

                //  $('#customer').chosen();

            });

        }


        $.fn.addToCart = function (id, count, stock) {
            console.log('this item was added to cart '+id+' this is number '+count+' this is stock '+stock)
            //checking internet availability here
            internetAvailable().then(function(){
                document.getElementById('onlineStatusIndicator').className ='btn btn-default waves-effect waves-light'
                document.getElementById('onlineStatus').innerHTML ='Online';
                network_status = 'Online';
                console.log("Internet available");
            }).catch(function(){
                document.getElementById('onlineStatusIndicator').className ='btn btn-danger waves-effect waves-light'
                document.getElementById('onlineStatus').innerHTML ='Offline';
                network_status = 'Offline';
                console.log("No internet");
            });


            console.log('this is the current status of network'+ network_status);
            window.addEventListener('online', internetAvailable())
            window.addEventListener('offline', internetAvailable())
            
            internetAvailable();

            if (stock == 1) {
                if (count > 0) {
                   
                    $.get(api + 'inventory/product/' + id, function (data) {
                    //the output returns an array, so we are pulling the first item, 
                    //it should be the only item anyway
                    console.log('this is the id'+id)
                    console.log('this is the intended'+data)

                        $(this).addProductToCart(data);
                    });
                }
                else {
                    Swal.fire(
                        'Out of stock!',
                        'This item is currently unavailable',
                        'info'
                    );
                }
            }
            else {
                $.get(api + 'inventory/product/' + id, function (data) {
                    $(this).addProductToCart(data[0]);
                });
            }

        };



        function barcodeSearch(e) {

            e.preventDefault();
            $("#basic-addon2").empty();
            $("#basic-addon2").append(
                $('<i>', { class: 'fa fa-spinner fa-spin' })
            );

            let req = {
                skuCode: $("#skuCode").val()
            }

            $.ajax({
                url: api + 'inventory/product/sku',
                type: 'POST',
                data: JSON.stringify(req),
                contentType: 'application/json; charset=utf-8',
                cache: false,
                processData: false,
                success: function (data) {

                    if (data._id != undefined && data.quantity >= 1) {
                        $(this).addProductToCart(data);
                        $("#searchBarCode").get(0).reset();
                        $("#basic-addon2").empty();
                        $("#basic-addon2").append(
                            $('<i>', { class: 'glyphicon glyphicon-ok' })
                        )
                    }
                    else if (data.quantity < 1) {
                        Swal.fire(
                            'Out of stock!',
                            'This item is currently unavailable',
                            'info'
                        );
                    }
                    else {

                        Swal.fire(
                            'Not Found!',
                            '<b>' + $("#skuCode").val() + '</b> is not a valid barcode!',
                            'warning'
                        );

                        $("#searchBarCode").get(0).reset();
                        $("#basic-addon2").empty();
                        $("#basic-addon2").append(
                            $('<i>', { class: 'glyphicon glyphicon-ok' })
                        )
                    }

                }, error: function (data) {
                    if (data.status === 422) {
                        $(this).showValidationError(data);
                        $("#basic-addon2").append(
                            $('<i>', { class: 'glyphicon glyphicon-remove' })
                        )
                    }
                    else if (data.status === 404) {
                        $("#basic-addon2").empty();
                        $("#basic-addon2").append(
                            $('<i>', { class: 'glyphicon glyphicon-remove' })
                        )
                    }
                    else {
                        $(this).showServerError();
                        $("#basic-addon2").empty();
                        $("#basic-addon2").append(
                            $('<i>', { class: 'glyphicon glyphicon-warning-sign' })
                        )
                    }
                }
            });

        }


        $("#searchBarCode").on('submit', function (e) {
            barcodeSearch(e);
        });



        $('body').on('click', '#jq-keyboard button', function (e) {
            let pressed = $(this)[0].className.split(" ");
            if ($("#skuCode").val() != "" && pressed[2] == "enter") {
                barcodeSearch(e);
            }
        });



        $.fn.addProductToCart = function (data) {


            
            item = {
                id: data._id,
                itemId: data.itemId,
                category: data.category,
                discount: 0,
                itemName: data.name,
                barcode: data.barcode,
                price: data.price,
                quantity: 1
            };

            if ($(this).isExist(item)) {
                $(this).qtIncrement(index);
            } else {
                cart.push(item);
                $(this).renderTable(cart)
            }
        }


        $.fn.isExist = function (data) {
            let toReturn = false;
            $.each(cart, function (index, value) {
                if (value.id == data.id) {
                    $(this).setIndex(index);
                    toReturn = true;
                }
            });
            return toReturn;
        }

        $.fn.isExistUniversal = function (data, testArray) {
            let toReturn = false;
            $.each(testArray, function (index, value) {
                if (value.id == data.id) {
                    $(this).setIndex(index);
                    toReturn = true;
                }
            });
            return toReturn;
        }


        $.fn.setIndex = function (value) {
            index = value;
        }


        $.fn.calculateCart = function () {
            let total = 0;
            let thisCartsVat = 0;
            let grossTotal;
            let vatExclusive = 0;
            $('#total').text(cart.length);
            $.each(cart, function (index, data) {
                total += data.quantity * data.price;
                if(data.itemId ==0){
                    thisCartsVat += ((data.quantity * data.price*vat)/115)
                }
                if(data.itemId !=0){
                    thisCartsVat += 0.0;
                }
            });
            total = total - $("#inputDiscount").val();
            
            $('#price').text(settings.symbol + " " + numberWithCommas(total));

            subTotal = total;

            if ($("#inputDiscount").val() >= total) {
                $("#inputDiscount").val(0);
            }

            if (settings.charge_tax) {
            
                totalVat = thisCartsVat;
                vatExclusive = total-totalVat;
                $("#vat_amount").text(numberWithCommas(totalVat.toFixed(2)));
              
                grossTotal = total;
            }

            else {
                $("#vat_amount").text(0);
                vatExclusive = total;
                grossTotal = total;

            }

            orderTotal = grossTotal.toFixed(2);
            $("#vat_exclusive").text(numberWithCommas(vatExclusive.toFixed(2)));
            $("#gross_price").text(settings.symbol + " " + numberWithCommas(grossTotal.toFixed(2)));
            $("#payablePrice").val(grossTotal);
            $("#payment").val(grossTotal);
        };



        $.fn.renderTable = function (cartList) {
            $('#cartTable > tbody').empty();
            $(this).calculateCart();
            $.each(cartList, function (index, data) {
                $('#cartTable > tbody').append(
                    $('<tr>').append(
                        $('<td>', { text: index + 1 }),
                        $('<td>', { text: data.itemName }),
                        $('<td>').append(
                            $('<div>', { class: 'input-group' }).append(
                                $('<div>', { class: 'input-group-btn btn-xs' }).append(
                                    $('<button>', {
                                        class: 'btn btn-default btn-xs',
                                        onclick: '$(this).qtDecrement(' + index + ')'
                                    }).append(
                                        $('<i>', { class: 'fa fa-minus' })
                                    )
                                ),
                                $('<input>', {
                                    class: 'form-control',
                                    type: 'number',
                                    value: data.quantity,
                                    onInput: '$(this).qtInput(' + index + ')'
                                }),
                                $('<div>', { class: 'input-group-btn btn-xs' }).append(
                                    $('<button>', {
                                        class: 'btn btn-default btn-xs',
                                        onclick: '$(this).qtIncrement(' + index + ')'
                                    }).append(
                                        $('<i>', { class: 'fa fa-plus' })
                                    )
                                )
                            )
                        ),
                        $('<td>', { text: settings.symbol + numberWithCommas((data.price * data.quantity).toFixed(2)) }),
                        $('<td>').append(
                            $('<button>', {
                                class: 'btn btn-danger btn-xs',
                                onclick: '$(this).deleteFromCart(' + index + ')'
                            }).append(
                                $('<i>', { class: 'fa fa-times' })
                            )
                        )
                    )
                )
            })
        };


        $.fn.deleteFromCart = function (index) {
            cart.splice(index, 1);
            $(this).renderTable(cart);

        }

        $.fn.arrayItemQtyIncrement = function (itemIndex,intendedArray,quantity) {
          let  thisItem = intendedArray[parseInt(itemIndex)];
          console.log('this is the itemssss'+intendedArray[parseInt(itemIndex)])
          thisItem.quantity +=quantity

         }

        $.fn.qtIncrement = function (i) {

            item = cart[i];
         //   console.log("the item is"+item)
            let product = allProducts.filter(function (selected) {
            //    console.log('selected '+selected.barcode)
            //    console.log('item id '+item.barcode)
                return selected.barcode == parseInt(item.barcode);
            });

            if (product[0].stock == 1) {
                if (item.quantity < product[0].quantity) {
                    item.quantity += 1;
                    $(this).renderTable(cart);
                }

                else {
                    Swal.fire(
                        'No more stock!',
                        'You have already added all the available stock.',
                        'info'
                    );
                }
            }
            else {
                item.quantity += 1;
                $(this).renderTable(cart);
            }

        }


        $.fn.qtDecrement = function (i) {
            if (item.quantity > 1) {
                item = cart[i];
                item.quantity -= 1;
                $(this).renderTable(cart);
            }
        }


        $.fn.qtInput = function (i) {
            item = cart[i];
            item.quantity = $(this).val();
            $(this).renderTable(cart);
        }


        $.fn.cancelOrder = function () {

            if (cart.length > 0) {
                Swal.fire({
                    title: 'Are you sure?',
                    text: "You are about to remove all items from the cart.",
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#3085d6',
                    cancelButtonColor: '#d33',
                    confirmButtonText: 'Yes, clear it!'
                }).then((result) => {

                    if (result.value) {

                        cart = [];
                        $(this).renderTable(cart);
                        holdOrder = 0;

                        Swal.fire(
                            'Cleared!',
                            'All items have been removed.',
                            'success'
                        )
                    }
                });
            }

        }


        $("#payButton").on('click', function () {
            if (cart.length != 0) {   
                $("#paymentModel").modal('toggle');
                
            } else {
                Swal.fire(
                    'Oops!',
                    'There is nothing to pay!',
                    'warning'
                );
            }

        });


        $("#hold").on('click', function () {

            if (cart.length != 0) {

                $("#dueModal").modal('toggle');
            } else {
                Swal.fire(
                    'Oops!',
                    'There is nothing to hold!',
                    'warning'
                );
            }
        });


        function printJobComplete() {
            alert("print job complete");
        }

        const opts = {
            errorCorrectionLevel: 'H',
            type: 'image/webp',
            quality: 0.95,
            margin: 1,
            color: {
             dark: '#208698',
             light: '#FFF',
            },
           };            

        async function generateQR(var_text){
                try{
                   await QRCode.toFile('assets/images/qrcodeImage.png', var_text, opts).then((qrImage) => {
                           
                        })
                    } catch (err) {
                        console.error(err)
                      }
            }


        $.fn.submitDueOrderOnline  = async function (status) {
            let items = "";
            let payment = 0;
            let count = 0;
            console.log('submitting this order with status'+status)
            cart.forEach(item => {

                items += "<tr><td>" + item.itemName + "</td><td>" + item.quantity + "</td><td>" + numberWithCommas(parseFloat(item.price).toFixed(2)) + "</td></tr>";
                count++;

                console.log('this is count'+count+'this is array lenght'+cart.length)
                if(count==cart.length){
                    items += "<tr><td><hr></td><td><hr></td><td><hr></td></tr>";
                }
            });

            let currentTime = new Date(moment());
            let customer = JSON.parse($("#customer").val());
            let date = moment(currentTime).format("YYYY-MM-DD HH:mm:ss");
            let refNumber = $("#refNumber").val();
            let paid = $("#payment").val() == "" ? "" : " "+ numberWithCommas (parseFloat($("#payment").val()).toFixed(2));
            let discount = $("#inputDiscount").val() == ''? 0: $("#inputDiscount").val() ;



            let salesCustomer = $("#salesCustomerName").val();
            let phoneNumber = $("#salesCustomerPhone").val();
            let change = $("#change").text() == "" ? "" : parseFloat($("#change").text()).toFixed(2);
            let orderNumber = holdOrder;
            let type = "";
            let tax_row = "";
            let network_state = "Connected";
          
            switch (paymentType) {

                case 1: type = "Cheque";
                    break;

                case 2: type = "Card";
                    break;

                default: type = "Cash";

            }


            if (paid != "") {
                payment = `<tr>
                        <td>Paid</td>
                        <td>:</td>
                        <td>${ numberWithCommas(paid)}</td>
                    </tr>
                    <tr>
                        <td>Change</td>
                        <td>:</td>
                        <td>${ numberWithCommas(Math.abs(change).toFixed(2))}</td>
                    </tr>
                    <tr>
                        <td>Method</td>
                        <td>:</td>
                        <td>${type}</td>
                    </tr>`
            }

            if (status == 0) {

                if ($("#customer").val() == 0 && $("#refNumber").val() == "") {
                    Swal.fire(
                        'Reference Required!',
                        'You either need to select a customer <br> or enter a reference!',
                        'warning'
                    )

                    return;
                }
            }
         

            $(".loading").show();


            if (holdOrder != 0) {

                orderNumber = holdOrder;
                method = 'PUT'
            }
            else {
                orderNumber = Math.floor(Date.now() / 1000);
                console.log(orderNumber);
                method = 'POST'
            }

            let customerQuery = {
                phoneNumber: phoneNumber,
                referenceNumber: orderNumber,
                salesCurrency: settings.symbol,
                salesCustomer: salesCustomer,
                salesItems: cart,
            }
            console.log("customer Query"+ JSON.stringify(customerQuery));
            let headerString = {'Content-Type': 'application/json','vfms-request-type': ''+ settings.vfms_request_type+'','vfms-intergration-id': ''+ settings.vfms_intergration_id+'','vfms-token-id': ''+ settings.vfms_token_id+''};
            console.log('this is the headerstring'+JSON.stringify(headerString));
            $.ajax({
                url: 'https://gateway.zanrevenue.org/vfms/api/sales/', //for live mode
              //url: 'http://102.223.7.131:6060/vfms/api/sales/', //for testing
                headers: {'Content-Type': 'application/json','vfms-request-type': ''+ settings.vfms_request_type+'','vfms-intergration-id': ''+ settings.vfms_intergration_id+'','vfms-token-id': ''+ settings.vfms_token_id+''},
                type: 'POST',
                data: JSON.stringify(customerQuery),
                contentType: 'application/json; charset=utf-8',
                cache: false,
                processData: false,
                success: async  function (responseData) {
                
                $("#receiptLoading").hide();
                
                var json = JSON.parse(JSON.stringify(responseData));
               
                console.log('this is the response data'+JSON.stringify(responseData));
                 
                await generateQR("https://portalvfms.zanrevenue.org/receipt-form/"+json.receiptNumber.toString());
                 
                  await $.fn.receiptAndSave(json);
                  
                },
                error: async function (responseData) {

                    $("#receiptLoading").hide();
                    $("#dueModal").modal('toggle');
                             Swal.fire("Connection lost!", 'Printing receipt offline');
                        await  $.fn.submitDueOrderOffline(1);
                }
            
            });
        
            
            $.fn.receiptAndSave =  function(json){
                console.log('this is the method used'+method)
                let date =  moment(json.issueDate).format("YYYY-MM-DD HH:mm:ss");
                let paidZRB = json.receitpAmount;
                let currentTime = json.issueDate;
                let customer = json.salesCustomer;
                let refNumber = json.referenceNumber;
                let receiptNumber = json.receiptNumber;
                let ZRBtaxAmount = json.taxAmount;

                let data = {
                    receiptNumber: receiptNumber==''? orderNumber: receiptNumber ,
                    order: orderNumber,
                    ref_number: refNumber,
                    customer: customer,
                    status: status,
                    subtotal: parseFloat(subTotal),
                    tax: ZRBtaxAmount,
                    order_type: 1,
                    items: cart,
                    date: currentTime,
                    payment_type: type,
                    payment_info: $("#paymentInfo").val(),
                    total: orderTotal,
                    paid: paid,
                    change: change,
                    _id: orderNumber,
                    till: platform.till,
                    mac: platform.mac,
                    user: user.fullname,
                    user_id: user._id,
                    flag:network_state,
                    saved:"false"
                }
    
          


            if (settings.charge_tax) {
                tax_row = `<tr>
                    <td>Vat(${settings.percentage})% </td>
                    <td>:</td>
                    <td>${numberWithCommas(parseFloat(json.taxAmount).toFixed(2))}</td>
                </tr>`;
            }
    
                receipt = `<div style="font-size: 10px;">                            
                <p style="text-align: center;">
                    ${settings.img == "" ?'<img style="max-width: 50px;max-width: 50px;" src ="assets/images/zrb_logo.png" /><br>' : '<img style="max-width: 50px;max-width: 50px;" src ="assets/images/zrb_logo.png" /><br>'}
                        <span style="font-size: 10px;">TAX PAYER: ${json.businessName}</span> <br>
                        Z NUMBER:  ${json.znumber} <br>
                        TIN:  ${json.tinNumber}<br>
                        VRN: ${json.vrnNumber} <br>
                        STREET: ${json.street}
                        </p>
                        <hr>
                        <left>
                            <p>
                            Ref No : ${receiptNumber} <br>
                            Customer Name : ${json.salesCustomer} <br>
                            Phone Number:${phoneNumber}<br>
                            Cashier : ${user.fullname} <br>
                            Issue Date : ${date}<br>         
                            </p>
                        </left>
                        <hr>
                        <table width="100%">
                            <thead style="text-align: left;">
                            <tr>
                                <th>Item</th>
                                <th>Qty</th>
                                <th>Price ${settings.symbol}</th>
                            </tr>
                            </thead>
                            <tbody>
                            ${items}                
                           
                            <tr>                        
                                <td><b>Total Tax Excl.</b></td>
                                <td>:</td>
                                <td><b>${json.salesCurrency}${" "+ numberWithCommas(json.taxExclussive.toFixed(2))}</b></td>
                            </tr>        
                            ${tax_row}
                            <tr>
                                <td><b>Total Amount: </b></td>
                                <td><b>:</b></td>
                                <td>
                                  <b>${settings.symbol} ${" " + numberWithCommas(parseFloat(paidZRB).toFixed(2))}</b>
                                </td>
                            </tr>
                            ${payment == 0 ? '' : payment}
                            </tbody>
                            </table>
                            <hr>
                            <br>
                            <p style="text-align: center;">
                            <img src = 'assets/images/qrcodeImage.png' style="max-height: 100px;max-width: 100px;"/>
                            </p>
                            
                            </div>`;
    
                            if (status == 3) {
                                if (cart.length > 0) {
    
                                    printJS({ printable: receipt, type: 'raw-html' });
    
                                    $(".loading").hide();
                                    return;
    
                                }
                                else {
    
                                    $(".loading").hide();
                                    return;
                                }
                            }
    
    
                $.ajax({
                    url: api + 'new',
                    type: method,
                    data: JSON.stringify(data),
                    contentType: 'application/json; charset=utf-8',
                    cache: false,
                    processData: false,
                    success: function (data) {
    
                        cart = [];
                        
                        $('#viewTransaction').html('');
                        $('#viewTransaction').html(receipt);
                        $('#orderModal').modal('show');
                        loadProducts();
                        loadCustomers();
                        $(".loading").hide();
                        $("#dueModal").modal('hide');
                        $("#paymentModel").modal('hide');
                        $(this).getHoldOrders();
                        $(this).getCustomerOrders();
                        $(this).renderTable(cart);
                        
                        console.log('product data successfully saved');
                    }, error: function (data) {
                        console.log('product data not saved');
                        $(".loading").hide();
                        $("#dueModal").modal('toggle');
                        Swal.fire("Something went wrong!", 'Please refresh this page and try again');
    
                    }
                });
    
                $("#refNumber").val('');
                $("#change").text('');
                $("#payment").val('');
            }
           
        }


        $.fn.submitDueOrderOffline = function (status) {

            let items = "";
            let payment = 0;
            let count = 0;

            cart.forEach(item => {

                items += "<tr><td>" + item.itemName + "</td><td>" + item.quantity + "</td><td> " + numberWithCommas(parseFloat(item.price).toFixed(2)) + "</td></tr>";

                count++;
                console.log('this is count'+count+'this is array lenght'+cart.length)
                if(count==cart.length){
                    items += "<tr><td><hr></td><td><hr></td><td><hr></td></tr>";
                }
            });

            let currentTime = new Date(moment());

            let discount = $("#inputDiscount").val();
            let customer = JSON.parse($("#customer").val());
            let date = moment(currentTime).format("YYYY-MM-DD HH:mm:ss");
            let paid = $("#payment").val() == "" ? "" : parseFloat($("#payment").val()).toFixed(2);
            let change = $("#change").text() == "" ? "" : parseFloat($("#change").text()).toFixed(2);
            let refNumber = $("#refNumber").val();
            let salesCustomer = $("#salesCustomerName").val();
            let phoneNumber = $("#salesCustomerPhone").val();
            let orderNumber = holdOrder;
            let receiptNumber = '';
            let type = "";
            let tax_row = "";
            let network_state = "Error";
            let total_tax_exclusive = 0.0;


            switch (paymentType) {

                case 1: type = "Cheque";
                    break;

                case 2: type = "Card";
                    break;

                default: type = "Cash";

            }


            if (paid != "") {
                payment = `<tr>
                        <td>Paid</td>
                        <td>:</td>
                        <td>${paid}</td>
                    </tr>

                    <tr>
                        <td>Change</td>
                        <td>:</td>
                        <td>${Math.abs(change).toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td>Method</td>
                        <td>:</td>
                        <td>${type}</td>
                    </tr>`
            }



            if (settings.charge_tax) {
                total_tax_exclusive = parseFloat(orderTotal).toFixed(2)- parseFloat(totalVat).toFixed(2);
                
                tax_row = `<tr>
                    <td>Vat(${settings.percentage})% </td>
                    <td>:</td>
                    <td>${parseFloat(totalVat).toFixed(2)}</td>
                </tr>`;
            }else{

                total_tax_exclusive = parseFloat(orderTotal).toFixed(2);
            }



            if (status == 0) {

                if ($("#customer").val() == 0 && $("#refNumber").val() == "") {
                    Swal.fire(
                        'Reference Required!',
                        'You either need to select a customer <br> or enter a reference!',
                        'warning'
                    )

                    return;
                }
            }


            $(".loading").show();


            if (holdOrder != 0) {

                orderNumber = holdOrder;
                method = 'PUT'
            }
            else {
                orderNumber = Math.floor(Date.now() / 1000);
                method = 'POST'
            }


        receipt = `<div style="font-size: 10px;">                            
        <p style="text-align: center;">
        ${settings.img == "" ?'<img style="max-height: 50px;max-width: 50px;" src ="assets/images/zrb_logo.png" /><br>' : '<img style="max-height: 50px;max-width: 50px;" src ="assets/images/zrb_logo.png" /><br>'}
            <span style="font-size: 10px;">TAX PAYER: ${settings.store}</span> <br>
            Z NUMBER:  ${settings.zNumber} <br>
            TIN:  ${settings.tinNumber}<br>
            VRN: ${settings.vrnNumber} <br>
            STREET: ${settings.address_one}
            </p>
            <hr>
        <left>

        Ref No : ${orderNumber} <br>
        Customer Name : ${salesCustomer} <br>
        Phone Number:${phoneNumber}<br>
        Cashier : ${user.fullname} <br>
        
        Issue Date : ${date}
        </left>
       
        <table width="100%">
            <thead style="text-align: left;">
            <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Price ${settings.symbol} </th>
            </tr>
            </thead>
            <tbody>
            ${items} 
            </tbody>  
                        
            <tr>  
                                 
                <td>Total Tax Excl.</td>
                <td>:</td>
                <td>${numberWithCommas(total_tax_exclusive)}</td>
            </tr>
           
            
            ${tax_row}
        <hr>
            <tr>
                <td><b>Total</b></td>
                <td><b>:</b></td>
                <td>
                    <b>${settings.symbol} ${" " +numberWithCommas(parseFloat(orderTotal).toFixed(2))}</b>
                </td>
            </tr>
            ${payment == 0 ? '' : payment}
            </tbody>
            </table>
            <hr>
            <br>
            <p style="text-align: center;">
                <img src = 'assets/images/qrcodeImage.png'style="max-height: 100px;max-width: 100px;" />
             </p>
            </div>`;


            if (status == 3) {
                if (cart.length > 0) {

                    printJS({ printable: receipt, type: 'raw-html' });

                    $(".loading").hide();
                    return;

                }
                else {

                    $(".loading").hide();
                    return;
                }
            }

            let data = {
                receiptNumber: receiptNumber==''? orderNumber: receiptNumber ,
                order: orderNumber,
                ref_number: refNumber,
                discount: discount,
                customer: customer,
                status: status,
                subtotal: parseFloat(subTotal),
                tax: totalVat,
                order_type: 1,
                items: cart,
                date: currentTime,
                payment_type: type,
                payment_info: $("#paymentInfo").val(),
                total: orderTotal,
                paid: paid,
                change: change,
                _id: orderNumber,
                till: platform.till,
                mac: platform.mac,
                user: user.fullname,
                user_id: user._id,
                flag: network_state,
                saved:"false"
            }
            console.log('this is data returned after save'+ JSON.stringify(data));
            let offlineOrderNumber = orderNumber;
                $.ajax({
                url: api + 'new',
                type: method,
                data: JSON.stringify(data),
                contentType: 'application/json; charset=utf-8',
                cache: false,
                processData: false,
                success:async function (data) {

                    await generateQR("https://portalvfms.zanrevenue.org/receipt-form/"+ offlineOrderNumber.toString());
                    cart = [];
                    $('#viewTransaction').html('');
                    $('#viewTransaction').html(receipt);
                    $('#orderModal').modal('show');
                    loadProducts();
                    loadCustomers();
                    $(".loading").hide();
                    $("#dueModal").modal('hide');
                    $("#paymentModel").modal('hide');
                    $(this).getHoldOrders();
                    $(this).getCustomerOrders();
                    $(this).renderTable(cart);
                    
                    console.log('returned response after saving '+data);
                }, error: function (data) {
                    console.log('product data not saved');
                    $(".loading").hide();
                    $("#dueModal").modal('toggle');
                    Swal("Something went wrong!", 'Please refresh this page and try again');

                }
            });

            $("#refNumber").val('');
            $("#change").text('');
            $("#payment").val('');

            
        }

        $.get(api + 'on-hold', function (data) {
            holdOrderList = data;
            holdOrderlocation.empty();
            clearInterval(dotInterval);
            $(this).randerHoldOrders(holdOrderList, holdOrderlocation, 1);
        });


        $.fn.getHoldOrders = function () {
            $.get(api + 'on-hold', function (data) {
                holdOrderList = data;
                clearInterval(dotInterval);
                holdOrderlocation.empty();
                $(this).randerHoldOrders(holdOrderList, holdOrderlocation, 1);
            });
        };


        $.fn.randerHoldOrders = function (data, renderLocation, orderType) {
            $.each(data, function (index, order) {
                $(this).calculatePrice(order);
                renderLocation.append(
                    $('<div>', { class: orderType == 1 ? 'col-md-3 order' : 'col-md-3 customer-order' }).append(
                        $('<a>').append(
                            $('<div>', { class: 'card-box order-box' }).append(
                                $('<p>').append(
                                    $('<b>', { text: 'Ref :' }),
                                    $('<span>', { text: order.ref_number, class: 'ref_number' }),
                                    $('<br>'),
                                    $('<b>', { text: 'Price :' }),
                                    $('<span>', { text: order.total, class: "label label-info", style: 'font-size:14px;' }),
                                    $('<br>'),
                                    $('<b>', { text: 'Items :' }),
                                    $('<span>', { text: order.items.length }),
                                    $('<br>'),
                                    $('<b>', { text: 'Customer :' }),
                                    $('<span>', { text: order.customer != 0 ? order.customer.name : 'Walk in customer', class: 'customer_name' })
                                ),
                                $('<button>', { class: 'btn btn-danger del', onclick: '$(this).deleteOrder(' + index + ',' + orderType + ')' }).append(
                                    $('<i>', { class: 'fa fa-trash' })
                                ),

                                $('<button>', { class: 'btn btn-default', onclick: '$(this).orderDetails(' + index + ',' + orderType + ')' }).append(
                                    $('<span>', { class: 'fa fa-shopping-basket' })
                                )
                            )
                        )
                    )
                )
            })
        }


        $.fn.calculatePrice = function (data) {
            totalPrice = 0;
            $.each(data.products, function (index, product) {
                totalPrice += product.price * product.quantity;
            })

            let vat = (totalPrice * data.vat) / 115;
            totalPrice = ((totalPrice) - data.discount).toFixed(0);

            return totalPrice;
        };


        $.fn.orderDetails = function (index, orderType) {

            $('#refNumber').val('');

            if (orderType == 1) {

                $('#refNumber').val(holdOrderList[index].ref_number);

                $("#customer option:selected").removeAttr('selected');

                $("#customer option").filter(function () {
                    return $(this).text() == "Walk in customer";
                }).prop("selected", true);

                holdOrder = holdOrderList[index]._id;
                cart = [];
                $.each(holdOrderList[index].items, function (index, product) {
                    item = {
                        id: product.id,
                        itemId: product.itemId,
                        discount: product.discount,
                        itemName: product.itemName,
                        barcode: product.barcode,
                        price: product.price,
                        quantity: product.quantity,
                        category: product.category
                    };
                    cart.push(item);
                })
            } else if (orderType == 2) {

                $('#refNumber').val('');

                $("#customer option:selected").removeAttr('selected');

                $("#customer option").filter(function () {
                    return $(this).text() == customerOrderList[index].customer.name;
                }).prop("selected", true);


                holdOrder = customerOrderList[index]._id;
                cart = [];
                $.each(customerOrderList[index].items, function (index, product) {
                    item = {
                        id: product.id,
                        itemId: product.itemId,
                        discount: product.discount,
                        itemName: product.itemName,
                        barcode: product.barcode,
                        price: product.price,
                        quantity: product.quantity
                    };
                    cart.push(item);
                })
            }
            $(this).renderTable(cart);
            $.fn.deleteOrder(index, orderType)
            $("#holdOrdersModal").modal('hide');
            $("#customerModal").modal('hide');
        }


        $.fn.deleteOrder = function (index, type) {

            switch (type) {
                case 1: deleteId = holdOrderList[index]._id;
                    break;
                case 2: deleteId = customerOrderList[index]._id;
            }

            let data = {
                orderId: deleteId,
            }

            Swal.fire({
                title: "Delete order?",
                text: "This will delete the order. Are you sure you want to delete!",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Yes, delete it!'
            }).then((result) => {

                if (result.value) {

                    $.ajax({
                        url: api + 'delete',
                        type: 'POST',
                        data: JSON.stringify(data),
                        contentType: 'application/json; charset=utf-8',
                        cache: false,
                        success: function (data) {

                            $(this).getHoldOrders();
                            $(this).getCustomerOrders();

                            Swal.fire(
                                'Deleted!',
                                'You have deleted the order!',
                                'success'
                            )

                        }, error: function (data) {
                            $(".loading").hide();

                        }
                    });
                }
            });
        }

        $.fn.deleteAllTransactions = function () {
            $.get(api + 'deleteTransactions', function (data) {
                console.log('all transactions data deleted');
                console.log('operation status'+data);
            });
        }

        $('#deleteAllTransactions').click(function () {

            user = storage.get('user');
            Swal.fire({
                title: 'All transactions will be deleted! Irreversibly!',
                html: `
               Enter the password to continue <input type="password" id="password" class="swal2-input" placeholder="Password">`,
                confirmButtonText: 'Continue',
                icon: 'warning',
                cancelButtonText: 'Close',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                focusConfirm: false,
                preConfirm: () => {
                  const password = Swal.getPopup().querySelector('#password').value
                  if (!password) {
                    Swal.showValidationMessage(`Please enter the password`)
                  }
                  return { password: password }
                }
              }).then((result) => {
                
                if(btoa(result.value.password)==user.password){
                    console.log('user authenticated');
                    $.fn.deleteAllTransactions();
                    loadUserList();
                    $('#pos_view').hide();
                    $('#pointofsale').show();
                    $('#transactions_view').show();
                    $('#showAllTransactions').hide();
                    $(this).hide();
                }else{
                    Swal.fire('incorrect password');
                    $('#pos_view').hide();
                    $('#pointofsale').show();
                    $('#showAllTransactions').show();
                    $(this).hide();
                }
                  
               
              })

           
        });




        $.fn.getCustomerOrders = function () {
            $.get(api + 'customer-orders', function (data) {
                clearInterval(dotInterval);
                customerOrderList = data;
                customerOrderLocation.empty();
                $(this).randerHoldOrders(customerOrderList, customerOrderLocation, 2);
            });
        }

        
        $.fn.showAllTransactions = function () {
            user = storage.get('user');
            Swal.fire({
                title: 'You need authorization to do this!',
                html: `
               Enter the password to continue <input type="password" id="password" class="swal2-input" placeholder="Password">`,
                confirmButtonText: 'Continue',
                icon: 'warning',
                cancelButtonText: 'Close',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                focusConfirm: false,
                preConfirm: () => {
                  const password = Swal.getPopup().querySelector('#password').value
                  if (!password) {
                    Swal.showValidationMessage(`Please enter the password`)
                  }
                  return { password: password }
                }
              }).then((result) => {
                
                if(btoa(result.value.password)==user.password){
                    console.log('user authenticated');
                    loadTransacts();
                    loadUserList();
                    $('#pos_view').hide();
                    $('#pointofsale').show();
                    $('#transactions_view').show();
                    $('#showAllTransactions').hide();
                    $(this).hide();
                }else{
                    Swal.fire('incorrect password');
                    $('#pos_view').hide();
                    $('#pointofsale').show();
                    $('#showAllTransactions').show();
                    $(this).hide();
                }
                  
               
              })
              
           
        }

        $.fn.importProducts = function(){

            $('#importProducts').modal('show');
        }

        $('#showAllTransactions').click(function () {
            

            $.fn.showAllTransactions();
        });



        $('#saveCustomer').on('submit', function (e) {

            e.preventDefault();

            let custData = {
                _id: Math.floor(Date.now() / 1000),
                name: $('#userName').val(),
                phone: $('#phoneNumber').val(),
                email: $('#emailAddress').val(),
                address: $('#userAddress').val()
            }

            $.ajax({
                url: api + 'customers/customer',
                type: 'POST',
                data: JSON.stringify(custData),
                contentType: 'application/json; charset=utf-8',
                cache: false,
                processData: false,
                success: function (data) {
                    $("#newCustomer").modal('hide');
                    Swal.fire("Customer added!", "Customer added successfully!", "success");
                    $("#customer option:selected").removeAttr('selected');
                    $('#customer').append(
                        $('<option>', { text: custData.name, value: `{"id": ${custData._id}, "name": ${custData.name}}`, selected: 'selected' })
                    );

                    $('#customer').val(`{"id": ${custData._id}, "name": ${custData.name}}`).trigger('chosen:updated');

                }, error: function (data) {
                    $("#newCustomer").modal('hide');
                    Swal.fire('Error', 'Something went wrong please try again', 'error')
                }
            })
        })


        $("#confirmPayment").hide();

        $("#cardInfo").hide();

        $("#payment").on('input', function () {
            $(this).calculateChange();
        });


        $("#confirmPayment").on('click', function () {

            if ($('#payment').val() == "") {
                Swal.fire(
                    'Nope!',
                    'Please enter the amount that was paid!',
                    'warning'
                );
            }
            else {
                console.log('this is the network status'+network_status);
                if(1){
              
                    $(this).submitDueOrderOnline(1);
            }else{
                 
                    $(this).submitDueOrderOffline(1);
            }
            }
        });


        $('#transactions').click(function () {
            $('#transactions_view').show();
            loadTransactions();
            loadUserList();
            $('#pos_view').hide();
            $('#Categories_view').hide();
            $('#deleteAllTransactions').show();
            $('#pointofsale').show();
            $('#categorysales').show();
            $('#sold_categories_view').hide();
            $('#showAllTransactions').show();
            $('#Products_view').hide();
            $("#product_search_view").hide();
            $(this).hide();

        });
        $('#categorysales').click(function () {
            loadTransactions();
            loadSoldCategoryList();
            console.log('loading category list')
            $('#sold_categories_view').show();
            $('#pos_view').hide();
            $('#Categories_view').hide();
            $('#deleteAllTransactions').show();
            $('#pointofsale').show();
            $('#transactions_view').hide();
            $('#categorysales').hide();
            $('#showAllTransactions').show();
            $('#transactions').show();
            $('#Products_view').hide();
            $("#product_search_view").hide();
            $(this).hide();

        });

        $('#categoryModal').click(function(){
            $('#pos_view').hide();
            $('#sold_categories_view').hide();
            $('#deleteAllTransactions').hide();
            $('#pointofsale').show();
            $('#transactions_view').hide();
            $('#Categories_view').show();
            $('#showAllTransactions').show();
            $('#Products_view').hide();
            $("#product_search_view").hide();

        })

        $('#productModal').click(function(){
            $("#loading").show();
            $("#product_search_view").show();
            $('#transactions_view').hide();
            $('#pos_view').hide();
            $('#sold_categories_view').hide();
            $('#deleteAllTransactions').hide();
            $('#pointofsale').show();
            $('#Categories_view').hide();
            $('#showAllTransactions').show();
            $('#Products_view').show();
            $("#loading").hide();

        })



        $('#pointofsale').click(function () {
            $('#Products_view').hide();
            $('#pos_view').show();
            $('#categorysales').hide();
            $('#sold_categories_view').hide();
            $('#deleteAllTransactions').hide();
            $('#transactions').show();
            $('#transactions_view').hide();
            $('#Categories_view').hide();
            $('#showAllTransactions').hide();
            
            $(this).hide();
        });


        $("#viewRefOrders").click(function () {
            setTimeout(function () {
                $("#holdOrderInput").focus();
            }, 500);
        });


        $("#viewCustomerOrders").click(function () {
            setTimeout(function () {
                $("#holdCustomerOrderInput").focus();
            }, 500);
        });


        $('#newProductModal').click(function () {
            document.getElementById('barcode').enabled ='true';
            document.getElementById('savetype').value ='new';
            $('#saveProduct').get(0).reset();
            $('#current_img').text('');
        });

        // $('#no_tax_item').click(function () {
            
        //     if($('#no_tax_item').val()=='on'){
        //         $('#itemId').show();
        //         $('#itemId').required = true;
        //     }
            
        //     if($('#no_tax_item').val()=='off'){
        //         $('#itemId').hide();
        //         $('#itemId').val()= 0;
        //     }
            
        // });



        $('#saveProduct').submit(function (e) {
            e.preventDefault();

            console.log("this is the brand name"+ $("#brand").val());
           
            $(this).attr('action', api + 'inventory/product');
            $(this).attr('method', 'POST');

            $(this).ajaxSubmit({
                contentType: 'application/json',
                success: function (response) {

                    $('#saveProduct').get(0).reset();
                    $('#current_img').text('');

                    loadProducts();
                    Swal.fire({
                        title: 'Product Saved',
                        text: "Select an option below to continue.",
                        icon: 'success',
                        showCancelButton: true,
                        confirmButtonColor: '#3085d6',
                        cancelButtonColor: '#d33',
                        confirmButtonText: 'Add another',
                        cancelButtonText: 'Close'
                    }).then((result) => {

                        if (!result.value) {
                            $("#newProduct").modal('hide');
                        }
                    });
                }, error: function (data) {
                    console.log(data);
                }
            });

        });

        $('#importProducts').submit(function (e) {
            e.preventDefault();
            let filename = '';

            $(this).attr('action', api + 'inventory/product/fileupload');
            $(this).attr('method', 'POST');

            $(this).ajaxSubmit({
                contentType: 'application/json',
                success: function (response) {
                    filename = response;
                    importFile(filename);
                    console.log('this is the file name'+response);
                    $('#importProducts').get(0).reset();
                    $('#current_img').text('');


                    loadProducts();
                    Swal.fire({
                        title: 'Product Saved',
                        text: "Select an option below to continue.",
                        icon: 'success',
                        showCancelButton: true,
                        confirmButtonColor: '#3085d6',
                        cancelButtonColor: '#d33',
                        confirmButtonText: 'Add another',
                        cancelButtonText: 'Close'
                    }).then((result) => {

                        if (!result.value) {
                            $("#newProduct").modal('hide');
                        }
                    });
                }, error: function (data) {
                    console.log(data);
                }
            });

            console.log('this is the obtained filename'+filename);

            


        });

     
            
        function importFile(importedfilename){

            const result = excelToJson({
                
                sourceFile: './public/uploads/' +importedfilename,
               
                header:{
                    // Is the number of rows that will be skipped and will not be present at our result object. Counting from top to bottom
                    rows: 1 // 2, 3, 4, etc.
                },
                columnToKey: {
                    //this configures the first row as the field keys name for example if column A1 has id and A2 has name then the resulting will be id:'12343', name: 'something'
                    '*': '{{columnHeader}}'
                }
            
            });
            let products = []
            let importedProducts = []
            let categoryID = '';
            let existingCategoryNames =[]
                products = result.Sheet1;

                allCategories.forEach((category, index)=>{
                    existingCategoryNames.push(category.name);
                })

                console.log('this is the original content'+existingCategoryNames)
             //for testing    products = [{"id":"","price":"1500","category":"Electronics","quantity":20,"name":"Chicken chips","stock":1,"img":"1663286556652.jpg"},{"id":"","price":"1500","category":"Snacks","quantity":20,"name":"Chicken chips","stock":1,"img":"1663286556652.jpg"},{"id":"","price":"1500","category":"Snacks","quantity":20,"name":"Chicken chips","stock":1,"img":"1663286556652.jpg"}]
                products.forEach((imported,index)=>{
                    
                console.log('this array content '+existingCategoryNames)
                console.log('this is the currently being imported '+imported.category)
                if(imported.category == ''){imported.category = "FAHUD"}
                    if (existingCategoryNames.indexOf(imported.category)==-1){
                        
                        let categoryID = Math.floor((Date.now() / 1000)-(11*index)); 
                        let newCategory = {
                            _id: categoryID,
                            name: imported.category
                        }
                                $.fn.saveImportedCategory(newCategory);

                                existingCategoryNames.push(newCategory.name);
                       }
                });
                
                 products.forEach((imported, index)=>{

                    let Product = {
                            _id: new BSON.ObjectID(), //parseInt(imported.barcode),
                            price: imported.price,
                            itemId: (imported.itemId ==""|| imported.itemId == null) ? 0: imported.itemId,
                            discount: imported.discount==""? 0: imported.discount,
                            category:  imported.category,
                            brand: imported.brand,
                            quantity: imported.quantity == "" ? 0 : imported.quantity,
                            barcode: parseInt(imported.barcode),
                            expiredate: imported.expiredate,
                            name: imported.name,
                            stock: imported.stock == "on" ? 0 : 1,    
                            img: imported.img        
                        }

                   
                        
                                if(imported.barcode == ""||imported.barcode==" "||imported.barcode=="nil") { 
                                        Product.barcode = Math.floor((Date.now() / 1000)-(11*index));  
                                }
                                
                                categoryID = allCategories.filter(function (category) {
                                    return category.name == imported.category;
                                });
                               
                                Product.category = categoryID[0]._id;
                                importedProducts.push(Product);
                            });
            
       
           
            $.ajax({
                contentType: 'application/json',
                url: api + 'inventory/product/import',
                type: 'POST',
                data: JSON.stringify(importedProducts),
                cache: false,
                processData: false,
                success: function (data) {

                        loadProducts();
                        Swal.fire({
                            title: 'Importing Completed',
                            text: "Select an option below to continue.",
                            icon: 'success',
                            showCancelButton: true,
                            confirmButtonColor: '#3085d6',
                            cancelButtonColor: '#d33',
                            confirmButtonText: 'Import another',
                            cancelButtonText: 'Close'
                        }).then((result) => {
        
                            if (!result.value) {
                                $("#newProduct").modal('hide');
                            }
                        });
                    
                   
                    
                }, error: function (data) {
                    console.log(data);
                }
            });

            counter++;
          };

          $.fn.categoryExist = function (categoryName) {
            let toReturn = false;
            allCategories.filter(function (category) {
                if(category.name == categoryName){

                    toReturn = true;
                }
                
            });
            console.log('the category exists? '+toReturn)
            return toReturn;
        }
          $.fn.saveImportedCategory = function (newCategory){
            
            method = 'POST';
            $.ajax({
                type: method,
                url: api + 'categories/category/imported',
                data: newCategory,
                success: function (data, textStatus, jqXHR) {
                 }

            });
          }

          $.fn.deleteAllCategories = function (){
            
            method = 'POST';
            $.ajax({
                type: method,
                url: api + 'categories/category/deleteall',
                success: function (data, textStatus, jqXHR) {
                 }

            });
          }

         

      
        $('#saveCategory').submit(function (e) {
            e.preventDefault();

            if ($('#category_id').val() == "") {
                method = 'POST';
            }
            else {
                method = 'PUT';
            }

            $.ajax({
                type: method,
                url: api + 'categories/category',
                data: $(this).serialize(),
                success: function (data, textStatus, jqXHR) {
                    $('#saveCategory').get(0).reset();
                    loadCategories();
                    loadProducts();
                    Swal.fire({
                        title: 'Category Saved',
                        text: "Select an option below to continue.",
                        icon: 'success',
                        showCancelButton: true,
                        confirmButtonColor: '#3085d6',
                        cancelButtonColor: '#d33',
                        confirmButtonText: 'Add another',
                        cancelButtonText: 'Close'
                    }).then((result) => {

                        if (!result.value) {
                            $("#newCategory").modal('hide');
                        }
                    });
                }, error: function (data) {
                    console.log(data);
                }

            });


        });


        $.fn.editProduct = function (index) {
          
            console.log('this is the index'+index)
            $('#Products').modal('hide');

            $("#category option").filter(function () {
                return $(this).val() == allProducts[index].category;
            }).prop("selected", true);
       //     document.getElementById('barcode').disabled = true; 
            $('#barcode').val(allProducts[index].barcode);
            
            $('#productName').val(allProducts[index].name);
            $('#product_price').val(allProducts[index].price);
            $('#quantity').val(allProducts[index].quantity);
            $('#brand').val(allProducts[index].brand);
            document.getElementById('savetype').value ='edit';
            $('#expiredate').val(allProducts[index].expiredate);

            $('#_id').val(allProducts[index]._id);
            $('#img').val(allProducts[index].img);
            $('#itemId').val(allProducts[index].itemId);

            if (allProducts[index].img != "") {

                $('#imagename').hide();
                $('#current_img').html(`<img src="${img_path + allProducts[index].img}" alt="">`);
                $('#rmv_img').show();
            }

            if (allProducts[index].stock == 0) {
                $('#stock').prop("checked", true);
            }
            // if (allProducts[index].itemId != 0) {
            //     $('#no_tax_item').prop("checked", true);
            //     $('#itemId').val(allProducts[index].itemId);
            //     $('#itemId').required = true;
            // }else{
            //     $('#no_tax_item').prop("checked", false);
            //     $('#itemId').val(allProducts[index].itemId);
            //     $('#itemId').required = true;
            // }
            

            $('#newProduct').modal('show');
        }

        $.fn.editProductUsingId = function (productId) {
          console.log('this is the product id'+productId)
        let letSearchProduct= allProducts.filter(function (product) {
                return product._id == productId;
            });

            console.log('this is the index'+ JSON.stringify(letSearchProduct[0]))
            $('#Products').modal('hide');

            $("#category option").filter(function () {
                return $(this).val() == letSearchProduct[0].category;
            }).prop("selected", true);
       //     document.getElementById('barcode').disabled = true; 
            $('#barcode').val(letSearchProduct[0].barcode);
            
            $('#productName').val(letSearchProduct[0].name);
            $('#product_price').val(letSearchProduct[0].price);
            $('#quantity').val(letSearchProduct[0].quantity);
            $('#brand').val(letSearchProduct[0].brand);
            document.getElementById('savetype').value ='edit';
            $('#expiredate').val(letSearchProduct[0].expiredate);

            $('#_id').val(letSearchProduct[0]._id);
            $('#img').val(letSearchProduct[0].img);
            $('#itemId').val(letSearchProduct[0].itemId);

            if (letSearchProduct[0].img != "") {

                $('#imagename').hide();
                $('#current_img').html(`<img src="${img_path + letSearchProduct[0].img}" alt="">`);
                $('#rmv_img').show();
            }

            if (letSearchProduct[0].stock == 0) {
                $('#stock').prop("checked", true);
            }
            // if (letSearchProduct[0].itemId != 0) {
            //     $('#no_tax_item').prop("checked", true);
            //     $('#itemId').val(letSearchProduct[0].itemId);
            //     $('#itemId').required = true;
            // }else{
            //     $('#no_tax_item').prop("checked", false);
            //     $('#itemId').val(letSearchProduct[0].itemId);
            //     $('#itemId').required = true;
            // }
            $('#newProduct').modal('show');
        }



        $("#userModal").on("hide.bs.modal", function () {
            $('.perms').hide();
        });


        $.fn.editUser = function (index) {

            user_index = index;

            $('#Users').modal('hide');

            $('.perms').show();

            $("#user_id").val(allUsers[index]._id);
            $('#fullname').val(allUsers[index].fullname);
            $('#username').val(allUsers[index].username);
            $('#password').val(atob(allUsers[index].password));

            if (allUsers[index].perm_products == 1) {
                $('#perm_products').prop("checked", true);
            }
            else {
                $('#perm_products').prop("checked", false);
            }

            if (allUsers[index].perm_categories == 1) {
                $('#perm_categories').prop("checked", true);
            }
            else {
                $('#perm_categories').prop("checked", false);
            }

            if (allUsers[index].perm_transactions == 1) {
                $('#perm_transactions').prop("checked", true);
            }
            else {
                $('#perm_transactions').prop("checked", false);
            }

            if (allUsers[index].perm_users == 1) {
                $('#perm_users').prop("checked", true);
            }
            else {
                $('#perm_users').prop("checked", false);
            }

            if (allUsers[index].perm_settings == 1) {
                $('#perm_settings').prop("checked", true);
            }
            else {
                $('#perm_settings').prop("checked", false);
            }

            $('#userModal').modal('show');
        }


        $.fn.editCategory = function (index) {
            $('#Categories').modal('hide');
            $('#categoryName').val(allCategories[index].name);
            $('#category_id').val(allCategories[index]._id);
            $('#newCategory').modal('show');
            

        }

        $.fn.deleteAllProducts = function () {
            $.ajax({
                url: api + 'inventory/delete/all',
                type: 'POST',
                success: function (result) {
                    console.log('this is the delete all result' +result);
                    loadProducts();
                    Swal.fire(
                        'Done!',
                        'Products deleted',
                        'success'
                    );

                }
            });
           
        }

        $('#deleteAllProducts').click(function () {

            user = storage.get('user');
            Swal.fire({
                title: 'All Products will be deleted! Irreversibly!',
                confirmButtonText: 'Continue',
                icon: 'warning',
                cancelButtonText: 'Close',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                focusConfirm: false,
              
              }).then((result) => {
                    console.log('user authenticated');
                    $.fn.deleteAllProducts();
                    loadUserList();
                    $('#pos_view').show();
                    $('#deleteAllTransactions').hide();
                    $('#pointofsale').hide();
                    $('#transactions_view').hide();
                    $(this).hide();
              })

           
        });



        $.fn.deleteProduct = function (id) {
            Swal.fire({
                title: 'Are you sure?',
                text: "You are about to delete this product.",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Yes, delete it!'
            }).then((result) => {

                if (result.value) {

                    $.ajax({
                        url: api + 'inventory/product/' + id,
                        type: 'DELETE',
                        success: function (result) {
                            loadProducts();
                            Swal.fire(
                                'Done!',
                                'Product deleted',
                                'success'
                            );

                        }
                    });
                }
            });
        }


        $.fn.deleteUser = function (id) {
            Swal.fire({
                title: 'Are you sure?',
                text: "You are about to delete this user.",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Yes, delete!'
            }).then((result) => {

                if (result.value) {

                    $.ajax({
                        url: api + 'users/user/' + id,
                        type: 'DELETE',
                        success: function (result) {
                            loadUserList();
                            Swal.fire(
                                'Done!',
                                'User deleted',
                                'success'
                            );

                        }
                    });
                }
            });
        }


        $.fn.deleteCategory = function (id) {
            Swal.fire({
                title: 'Are you sure?',
                text: "You are about to delete this category.",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Yes, delete it!'
            }).then((result) => {

                if (result.value) {

                    $.ajax({
                        url: api + 'categories/category/' + id,
                        type: 'DELETE',
                        success: function (result) {
                            loadCategories();
                            Swal.fire(
                                'Done!',
                                'Category deleted',
                                'success'
                            );

                        }
                    });
                }
            });
        }

        $('#productModal').click( function () {
            $("#loading").show();
                loadProductList();
           $("#loading").hide();
        });


        $('#usersModal').click(function () {
            loadUserList();
        });


        // $('#categoryModal').click(function () {
        //     loadCategoryList();
        // });


        function loadUserList() {

            let counter = 0;
            let user_list = '';
            $('#user_list').empty();
           // $('#userList').DataTable().destroy();

            $.get(api + 'users/all', function (users) {


                
                allUsers = [...users];
                //console.log('thsese are all the users '+ JSON.stringify(allUsers))

                users.forEach((user, index) => {

                    state = [];
                    let class_name = '';

                    if (user.status != "") {
                        state = user.status.split("_");

                        switch (state[0]) {
                            case 'Logged In': class_name = 'btn-default';
                                break;
                            case 'Logged Out': class_name = 'btn-light';
                                break;
                        }
                    }

                    counter++;
                    user_list += `<tr>
            <td>${user.fullname}</td>
            <td>${user.username}</td>
            <td class="${class_name}">${state.length > 0 ? state[0] : ''} <br><span style="font-size: 11px;"> ${state.length > 0 ? moment(state[1]).format('hh:mm A DD MMM YYYY') : ''}</span></td>
            <td>${user._id == 1 ? '<span class="btn-group"><button class="btn btn-dark"><i class="fa fa-edit"></i></button><button class="btn btn-dark"><i class="fa fa-trash"></i></button></span>' : '<span class="btn-group"><button onClick="$(this).editUser(' + index + ')" class="btn btn-warning"><i class="fa fa-edit"></i></button><button onClick="$(this).deleteUser(' + user._id + ')" class="btn btn-danger"><i class="fa fa-trash"></i></button></span>'}</td></tr>`;

                    if (counter == users.length) {

                        $('#user_list').html(user_list);

                        $('#userList').DataTable({
                            "order": [[1, "desc"]]
                            , "autoWidth": false
                            , "retrieve": true
                            , "info": true
                            , "JQueryUI": true
                            , "ordering": true
                            , "paging": false
                        });
                    }

                });

            });
        }


    async  function loadProductList() {

        console.log('this is the chosen list '+displayProducts)
            let products = [...allProducts];
            let product_list = '';
            let counter = 0;
            $('#product_list').empty();
        //   $('#productList').DataTable().destroy();
            
           //console.log('these are display products'+JSON.stringify(displayProducts))

            products.forEach((product, index) => {

                counter++;

                let category = allCategories.filter(function (category) {
                    return category._id == product.category;
                });


            product_list += `<tr>
            <td>${product.barcode}</td>
            <!--td><img style="max-height: 50px; max-width: 30px; border: 1px solid #ddd;" src="${product.img == "" ? "./assets/images/default.jpg" : img_path + product.img}" id="product_img"></td-->
            <td>${product.name}</td>
            <td>${settings.symbol}${product.price}</td>
            <td>${product.stock}</td>
            <td>${product.quantity}</td>
            <td>${category.length > 0 ? category[0].name : ''}</td>
            <td class="nobr"><span class="btn-group"><button onClick="$(this).editProduct(${index})" class="btn btn-warning btn-sm"><i class="fa fa-edit"></i></button><button onClick="$(this).deleteProduct('${product._id}')" class="btn btn-danger btn-sm"><i class="fa fa-trash"></i></button></span></td></tr>`;

                if (counter == displayProducts.length) {

                    $('#product_list').html(product_list);
                    $('#productList').DataTable({
                        "order": [[1, "desc"]]
                        , "autoWidth": false
                        , "info": true
                        ,"retrieve": true
                        , "JQueryUI": true
                        , "ordering": true
                        , "paging": false
                        ,"dom": 'Bfrtip'
                        ,"buttons": ['csv', 'excel', 'pdf',]
                    });
                }

            });
        }

        function categoryItemsCounter(){
            let products = [...displayProducts];
            let categoryItemCount = 0;

            products.forEach((product,productIndex) =>{
                if(product.category == thiscategory._id){
                    categoryItemCount++;
                }
            })
        }
        function loadCategoryList() {
            let products = [...displayProducts];
            let category_list = '';
            let counter = 0;
            let categoryItemCount = 0;
            $('#category_list').empty();
            $('#categoryList').DataTable().destroy();

            allCategories.forEach((thiscategory, index) => {
             
                products.forEach((product,productIndex) =>{
                    if(product.category == thiscategory._id){
                        categoryItemCount++;
                    }
                })
               
                counter++;

                category_list += `<tr>
            <td>${thiscategory._id}</td>
            <td>${thiscategory.name}</td>
            <td>${categoryItemCount}</td>
            <td><span class="btn-group"><button onClick="$(this).editCategory(${index})" class="btn btn-warning"><i class="fa fa-edit"></i></button><button onClick="$(this).deleteCategory(${category._id})" class="btn btn-danger"><i class="fa fa-trash"></i></button></span></td></tr>`;
            });

            if (counter == allCategories.length) {

                $('#category_list').html(category_list);
                $('#categoryList').DataTable({
                    "autoWidth": false
                    , "info": true
                    , "JQueryUI": true
                    , "ordering": true
                    , "paging": false
                    ,"dom": 'Bfrtip'
                    ,"buttons": ['csv', 'excel', 'pdf',]

                });
            }
        }


        $.fn.serializeObject = function () {
            var o = {};
            var a = this.serializeArray();
            $.each(a, function () {
                if (o[this.name]) {
                    if (!o[this.name].push) {
                        o[this.name] = [o[this.name]];
                    }
                    o[this.name].push(this.value || '');
                } else {
                    o[this.name] = this.value || '';
                }
            });
            return o;
        };



        $('#log-out').click(function () {

            Swal.fire({
                title: 'Are you sure?',
                text: "You are about to log out.",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Logout'
            }).then((result) => {

                if (result.value) {
                    $.get(api + 'users/logout/' + user._id, function (data) {
                        storage.delete('auth');
                        storage.delete('user');
                        ipcRenderer.send('app-reload', '');
                    });
                }
            });
        });



        $('#settings_form').on('submit', function (e) {
            e.preventDefault();
            let formData = $(this).serializeObject();
            let mac_address;

            api = 'http://' + host + ':' + port + '/api/';

            macaddress.one(function (err, mac) {
                mac_address = mac;
            });

            formData['app'] = $('#app').find('option:selected').text();
            formData['mac'] = mac_address;
            formData['till'] = 1;

            $('#settings_form').append('<input type="hidden" name="app" value="' + formData.app + '" />');

            if (formData.percentage != "" && !$.isNumeric(formData.percentage)) {
                Swal.fire(
                    'Oops!',
                    'Please make sure the tax value is a number',
                    'warning'
                );
            }
            else {
                storage.set('settings', formData);

                $(this).attr('action', api + 'settings/post');
                $(this).attr('method', 'POST');


                $(this).ajaxSubmit({
                    contentType: 'application/json',
                    success: function (response) {

                        ipcRenderer.send('app-reload', '');

                    }, error: function (data) {
                        console.log(data);
                    }

                });

            }

        });



        $('#net_settings_form').on('submit', function (e) {
            e.preventDefault();
            let formData = $(this).serializeObject();

            if (formData.till == 0 || formData.till == 1) {
                Swal.fire(
                    'Oops!',
                    'Please enter a number greater than 1.',
                    'warning'
                );
            }
            else {
                if (isNumeric(formData.till)) {
                    formData['app'] = $('#app').find('option:selected').text();
                    storage.set('settings', formData);
                    ipcRenderer.send('app-reload', '');
                }
                else {
                    Swal.fire(
                        'Oops!',
                        'Till number must be a number!',
                        'warning'
                    );
                }

            }

        });



        $('#saveUser').on('submit', function (e) {
            e.preventDefault();
            let formData = $(this).serializeObject();

            console.log(formData);

            if (ownUserEdit) {
                if (formData.password != atob(user.password)) {
                    if (formData.password != formData.pass) {
                        Swal.fire(
                            'Oops!',
                            'Passwords do not match!',
                            'warning'
                        );
                    }
                }
            }
            else {
                if (formData.password != atob(allUsers[user_index].password)) {
                    if (formData.password != formData.pass) {
                        Swal.fire(
                            'Oops!',
                            'Passwords do not match!',
                            'warning'
                        );
                    }
                }
            }



            if (formData.password == atob(user.password) || formData.password == atob(allUsers[user_index].password) || formData.password == formData.pass) {
                $.ajax({
                    url: api + 'users/post',
                    type: 'POST',
                    data: JSON.stringify(formData),
                    contentType: 'application/json; charset=utf-8',
                    cache: false,
                    processData: false,
                    success: function (data) {

                        if (ownUserEdit) {
                            ipcRenderer.send('app-reload', '');
                        }

                        else {
                            $('#userModal').modal('hide');

                            loadUserList();

                            $('#Users').modal('show');
                            Swal.fire(
                                'Ok!',
                                'User details saved!',
                                'success'
                            );
                        }


                    }, error: function (data) {
                        console.log(data);
                    }

                });

            }

        });



        $('#app').change(function () {
            if ($(this).find('option:selected').text() == 'Network Point of Sale Terminal') {
                $('#net_settings_form').show(500);
                $('#settings_form').hide(500);
                macaddress.one(function (err, mac) {
                    $("#mac").val(mac);
                });
            }
            else {
                $('#net_settings_form').hide(500);
                $('#settings_form').show(500);
            }

        });



        $('#cashier').click(function () {

            ownUserEdit = true;

            $('#userModal').modal('show');

            $("#user_id").val(user._id);
            $("#fullname").val(user.fullname);
            $("#username").val(user.username);
            $("#password").val(atob(user.password));

        });



        $('#add-user').click(function () {

            if (platform.app != 'Network Point of Sale Terminal') {
                $('.perms').show();
            }

            $("#saveUser").get(0).reset();
            $('#userModal').modal('show');

        });



        $('#settings').click(function () {

            if (platform.app == 'Network Point of Sale Terminal') {
                $('#net_settings_form').show(500);
                $('#settings_form').hide(500);

                $("#ip").val(platform.ip);
                $("#till").val(platform.till);

                macaddress.one(function (err, mac) {
                    $("#mac").val(mac);
                });

                $("#app option").filter(function () {
                    return $(this).text() == platform.app;
                }).prop("selected", true);
            }
            else {
                $('#net_settings_form').hide(500);
                $('#settings_form').show(500);

                $("#settings_id").val("1");
                $("#store").val(settings.store);
                $("#address_one").val(settings.address_one);
                $("#vfms_token_id").val(settings.vfms_token_id);
                $("#vfms_intergration_id").val(settings.vfms_intergration_id);
                $("#vfms_request_type").val(settings.vfms_request_type);
                $("#tinNumber").val(settings.tinNumber);
                $("#zNumber").val(settings.zNumber);
                $("#contact").val(settings.contact);
                $("#tax").val(settings.tax);
                $("#symbol").val(settings.symbol);
                $("#percentage").val(settings.percentage);
                $("#footer").val(settings.footer);
                $("#logo_img").val(settings.img);
                if (settings.charge_tax == 'on') {
                    $('#charge_tax').prop("checked", true);
                }
                if (settings.img != "") {
                    $('#logoname').hide();
                    $('#current_logo').html(`<img src="${img_path + settings.img}" alt="">`);
                    $('#rmv_logo').show();
                }

                $("#app option").filter(function () {
                    return $(this).text() == settings.app;
                }).prop("selected", true);
            }




        });


    });


    $('#rmv_logo').click(function () {
        $('#remove_logo').val("1");
        $('#current_logo').hide(500);
        $(this).hide(500);
        $('#logoname').show(500);
    });


    $('#rmv_img').click(function () {
        $('#remove_img').val("1");
        $('#current_img').hide(500);
        $(this).hide(500);
        $('#imagename').show(500);
    });


    $('#print_list').click(function () {

        $("#loading").show();

        $('#productList').DataTable().destroy();

        const filename = 'productList.pdf';

        html2canvas($('#all_products').get(0)).then(canvas => {
            let height = canvas.height * (25.4 / 96);
            let width = canvas.width * (25.4 / 96);
            let pdf = new jsPDF('p', 'mm', 'a4');
            pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, width, height);

            $("#loading").hide();
            pdf.save(filename);
        });



        $('#productList').DataTable({
            "order": [[1, "desc"]]
            , "autoWidth": false
            , "info": true
            , "JQueryUI": true
            , "ordering": true
            , "paging": false,
            "dom": 'Bfrtip',
            "buttons": ['csv', 'excel', 'pdf',]
        });

        $(".loading").hide();

    });

}


$.fn.print = function () {

    printJS({ printable: receipt, type: 'raw-html' });

}

let last_sales_summary = ''
let sales_summary = '';
function loadTransacts() {

    let tills = [];
    let users = [];
    let sales = 0;
    let transact = 0;
    let totalTax = 0;
    let payableTax = 0;
    let unique = 0;

    sold_items = [];
    sold = [];

    let counter = 0;
    let errCount = 0;
    let transaction_list = '';
    let query = `by-date?start=${start_date}&end=${end_date}&user=${by_user}&status=${by_status}&till=${by_till}`;


    $.get(api + query, function (transactions) {

        
        if (transactions.length > 0) {


            $('#transaction_list').empty();
            $('#transactionList').DataTable().destroy();

            allTransactions = [...transactions];

            transactions.forEach((trans, index) => {
               

                

                sales += parseFloat(trans.total);
                totalTax += trans.tax;

                if(trans.flag != 'saved'){
                    payableTax += trans.tax; 
                }
 
                transact++;

                trans.items.forEach(item => {
                    
                        sold_items.push(item);
                });

                
                if (!tills.includes(trans.till)) {
                    tills.push(trans.till);
                }

                if (!users.includes(trans.user_id)) {
                    users.push(trans.user_id);
                }

                

                counter++;
               
                transaction_list += `<tr>
                                <td>${trans.receiptNumber}</td>
                                <td class="nobr">${moment(trans.date).format('YYYY MMM DD hh:mm:ss')}</td>
                                <td>${numberWithCommas(trans.total)}</td>
                                <td>${trans.paid == "" ? "" : numberWithCommas(trans.paid)}</td>
                                <td>${trans.paid == "" ? "" : numberWithCommas(trans.paid)}</td>
                                <td>${trans.tax}</td>
                                <td>${trans.till}</td>
                                <td>${trans.user}</td>
                                <td>${trans.flag}</td>
                                <td><button class="btn btn-dark"><i class="fa fa-save"></i></button></td>
                                <td>${trans.paid == "" ? '<button class="btn btn-dark"><i class="fa fa-search-plus"></i></button>' : '<button onClick="$(this).viewTransaction(' + index + ')" class="btn btn-info"><i class="fa fa-search-plus"></i></button></td>'}</tr>
                    `;
                
            
                if (counter == transactions.length) {

                    $('#total_sales_1 #counter').text(numberWithCommas(parseFloat(sales).toFixed(2)));
                    $('#total_transactions_1 #counter').text(transact);
                    $('#total_tax_payable #counter').text(numberWithCommas(parseFloat(sales*(15/115)).toFixed(2)));
                    $('#trans_currency').text(settings.symbol);
                    
                    // sales_summary += `<tr>
                    //                 <td>${text(numberWithCommas(parseFloat(sales).toFixed(2)))}</td>
                    //                 <td>${text(transact)}</td>
                    //                 <td>${text(numberWithCommas(parseFloat(sales*0.15).toFixed(2)))}</td>
                    //                 ${last_sales_summary}
                    //             <tr>`
                    
                    const result = {};
                    
                    for (const { itemName, price, quantity, id, category, itemId } of sold_items) {
                        if (!result[id]) result[id] = [];
                        result[id].push({ id, price, itemName, quantity, category, itemId });
                    }

                    for (item in result) {

                        let price = 0;
                        let itemName ='';
                        let quantity = 0;
                        let id = 0;
                        let itemId =0;
                        let category = "";

                        result[item].forEach(i => {
                            id = i.id;
                            price = i.price;
                            itemName = i.itemName
                            quantity += i.quantity;
                            category = i.category;
                            itemId= i.itemId ;
                        });

                        sold.push({
                            id: id,
                            itemName: itemName,
                            qty: quantity,
                            price: price,
                            category: category,
                            itemId:itemId,
                        });
                    }

                //   loadSoldCategoryList();

                  //  loadSoldProducts();


                    if (by_user == 0 && by_till == 0) {

                        userFilter(users);
                        tillFilter(tills);
                    }


                    $('#transaction_list').html(transaction_list);
                    $('#transactionList').DataTable({
                        "order": [[1, "desc"]]
                        , "autoWidth": false
                        , "info": true
                        , "JQueryUI": true
                        , "ordering": true
                        , "paging": true,
                        "dom": 'Bfrtip',
                        "buttons": ['csv', 'excel', 'pdf',]

                    });

                    
                }
            });
        }
        else {
            Swal.fire(
                'No data!',
                'No transactions available within the selected criteria',
                'warning'
            );
        }

    });
}

// function loadSoldCategoryList() {

//     let categories_sales_list = '';
//     let allSoldCategoryDetails = [];
//     let soldCategories = [];
//     let counter = 0;
//     let categoryTax = 0;
//     let soldItems = [];
//     let totalForAll = 0;

  

//     let query = `by-date?start=${start_date}&end=${end_date}&user=${by_user}&status=${by_status}&till=${by_till}`;


//     $.get(api + query, function (transactions) {

//         if (transactions.length > 0) {
//             allTransactions = [...transactions];
       

//             $('#categories_sales_list').empty();
//            // $('#categorySalesList').DataTable().destroy();

//     //getting the transaction items
//     allTransactions.forEach((transaction,index)=>{
        
//     let transactionItems = transaction.items;

//     transactionItems.forEach((transactionItem,index)=>{
//         soldItems.push(transactionItem);
//     })
//     })
    
//     //getting the categories from each transaction item
//     soldItems.forEach((soldItem,index)=>{

//         console.log('this solditems category'+ JSON.stringify(soldItem.category))
//         if(soldCategories.indexOf(soldItem.category)==-1){
//             soldCategories.push(soldItem.category); 
//         }
        
//     })

//     console.log("this are all sold categories"+soldCategories);
//     //getting items for each category
//     soldCategories.forEach((soldCategory, index)=>{
//         let thisCategoryItems = [];
//         let thisCategorySales = 0;
//         let thisCategoryCount = 0
//         let thisCategoryTax = 0.0;

//         console.log("this is sold category"+soldCategory)

//         let category = allCategories.filter((selected,index)=>{
//             return selected._id == soldCategory
//         })

//         let categoryName = category[0].name;

//         sold.forEach((item,index)=>{
           
//             if(item.category == soldCategory){
        
//                 thisCategoryItems.push(item);        
//                 thisCategorySales += item.qty * item.price
//                 thisCategoryCount++;
//                 if(item.itemId == 0){
//                     thisCategoryTax += 0.15*item.qty*item.price
//                 }
//                 if(item.itemId !=0){
//                     thisCategoryTax += 0.0;
//                 }
//             }
//         console.log('this are the sales'+thisCategorySales);
//         });
//     //collecting details for each sold category 
//     let soldCategoryDetails = {
//             categoryId: soldCategory,
//             categoryName: categoryName,
//             categoryItems: thisCategoryItems,
//             thisCategorySales: thisCategorySales,
//             thisCategoryCount: thisCategoryCount,
//             thisCategoryTax: thisCategoryTax ,
//         }
//     //putting all categories and their details in one place
//     allSoldCategoryDetails.push(soldCategoryDetails);
    
//     })
  

//     allSoldCategoryDetails.forEach((soldCategory, index) => {
        
//         let categoryItems = []
//         let displayItems = ''
//         let itemTax = 0.0
//         categoryItems = soldCategory.categoryItems;

//         categoryItems.forEach((item, index)=>{
//             if(item.itemId==0){
//                 itemTax = parseFloat(0.15*item.qty*item.price).toFixed(2)
//             }
//             if(item.itemId !=0){
//                 itemTax = 0.0
//             }
//             console.log('this is item sample '+JSON.stringify(item))

//             if(index==0){
//                 categories_sales_list += `<tr>
//                 <td>${soldCategory.categoryName}</td>
//                 <td>${soldCategory.thisCategoryCount}</td>
//                 <td>${numberWithCommas(soldCategory.thisCategorySales)}</td>
//                 <td>${numberWithCommas((soldCategory.thisCategoryTax).toFixed(2))}</td>
//                 <td>${item.itemName}</td>
//                 <td>${item.price}</td>
//                 <td>${item.qty}</td>
//                 <td>${parseFloat(item.qty*item.price).toFixed(2)}</td>
//                 <td>${itemTax}</td>
//             </tr>`
//             }else{
//                 categories_sales_list +=  `<tr>
//                              <td>${soldCategory.categoryName}</td>
//                              <td></td>
//                              <td></td>
//                              <td></td>
//                              <td>${item.itemName}</td>
//                              <td>${item.price}</td>
//                              <td>${item.qty}</td>
//                              <td>${parseFloat(item.qty*item.price).toFixed(2)}</td>
//                              <td>${itemTax}</td>
//                              <tr>`
//             }
//         })
        
//         totalForAll += soldCategory.thisCategorySales; 
          
//         counter++;
//             if(counter == allSoldCategoryDetails.length){
//                 categories_sales_list += `<tr>
//                 <td><b>TOTAL SALES</b></td>
//                 <td><b>${numberWithCommas(totalForAll)}</b></td>
//                 <td><b>NO OF CATEGORIES</b></td>
//                 <td><b>${allSoldCategoryDetails.length}</b></td>
//                 <td></td>
//                 <td></td>
//                 <td></td>
//                 <td></td>
//                 <td></td>
//                 </tr>`
//             }
//             console.log('this is the counter'+counter+' and this is the length '+soldCategory.length)
        
//         });

//         console.log('this is main total'+numberWithCommas(totalForAll))
        
        
//         $('#categories_sales_list').html(categories_sales_list);
//         $('#categorySalesList').DataTable({
//             "order": [[1, "desc"]]
//             , "autoWidth": true
//             ,"retrieve": true
//             , "info": true
//             , "JQueryUI": true
//             , "ordering": false
//             , "paging": true,
//             "dom": 'Bfrtip',
//             "buttons": ['csv', 'excel', 'pdf',]

//         });
//     }
//     })
//  }
function loadSoldCategoryList() {

    let categories_sales_list = '';
    let allSoldCategoryDetails = [];
    let soldCategories = [];
    let counter = 0;
    let soldItems = [];
    let totalForAll = 0;

  

    let query = `by-date?start=${start_date}&end=${end_date}&user=${by_user}&status=${by_status}&till=${by_till}`;


    $.get(api + query, function (transactions) {

        if (transactions.length > 0) {
            allTransactions = [...transactions];
       

            $('#categories_sales_list').empty();
           // $('#categorySalesList').DataTable().destroy();

    //getting the transaction items
    allTransactions.forEach((transaction,index)=>{
        
    let transactionItems = transaction.items;

    transactionItems.forEach((transactionItem,index)=>{
        soldItems.push(transactionItem);
    })
    })
    
    //getting the categories from each transaction item
    soldItems.forEach((soldItem,index)=>{

        console.log('this solditems category'+ JSON.stringify(soldItem.category))
        if(soldCategories.indexOf(soldItem.category)==-1){
            soldCategories.push(soldItem.category); 
        }
        
    })

    console.log("this are all sold categories"+soldCategories);
    //getting items for each category
    soldCategories.forEach((soldCategory, index)=>{
        let thisCategoryItems = [];
        let thisCategorySales = 0;
        let thisCategoryCount = 0;
        let thisCategoryTax =0;

        console.log("this is sold category"+soldCategory)
        console.log('this are all the categories'+JSON.stringify(allCategories))
        let category = allCategories.filter((selected,index)=>{
            return selected._id == soldCategory
        })

        let categoryName = category[0].name;

        sold.forEach((item,index)=>{
           
            if(item.category == soldCategory){
        
                thisCategoryItems.push(item);        
                thisCategorySales += item.qty * item.price
                thisCategoryCount++;
                if(item.itemId == 0){
                    thisCategoryTax += (15/115)*item.qty*item.price
                }
                if(item.itemId !=0){
                    thisCategoryTax += 0.0;
                }
            }
        console.log('this are the sales'+thisCategorySales);
        });
    //collecting details for each sold category 
    let soldCategoryDetails = {
            categoryId: soldCategory,
            categoryName: categoryName,
            categoryItems: thisCategoryItems,
            thisCategorySales: thisCategorySales,
            thisCategoryCount: thisCategoryCount,
            thisCategoryTax: thisCategoryTax
        }
    //putting all categories and their details in one place
    allSoldCategoryDetails.push(soldCategoryDetails);
    
    })
  

    allSoldCategoryDetails.forEach((soldCategory, index) => {
        let itemTax = 0;
        let categoryItems = []
        let displayItems = ''
        let itemcounter = 0;
        categoryItems = soldCategory.categoryItems;
        
        categoryItems.forEach((item, index)=>{
            if(item.itemId==0){
                itemTax = parseFloat((15/115)*item.qty*item.price).toFixed(2)
            }
            if(item.itemId !=0){
                itemTax = 0.0
            }
            if(index==0){ 
                categories_sales_list += `<tr>
            <td><b>${soldCategory.categoryName}</b></td>
            <td><b>${soldCategory.thisCategoryCount}</b></td>
            <td><b>${numberWithCommas(soldCategory.thisCategorySales)}</b></td>
            <td><b>${numberWithCommas((soldCategory.thisCategoryTax).toFixed(2))}</b></td>
            <td>${item.itemName}</td>
            <td>${item.price}</td>
            <td>${item.qty}</td>
            <td>${parseFloat(item.qty*item.price).toFixed(2)}</td>
            <td>${itemTax}</td>
            </tr>`;
            console.log('this is the item counter'+ index)
            }else{
                categories_sales_list += `<tr>
                <td>${soldCategory.categoryName}</td>
                <td></td>
                <td></td>
                <td></td>
                <td>${item.itemName}</td>
                <td>${item.price}</td>
                <td>${item.qty}</td>
                <td>${parseFloat(item.qty*item.price).toFixed(2)}</td>
                <td>${itemTax}</td>
                </tr>`;
            console.log('this is the item counter'+ index)
            }
           
         

           
                 
           
        
           
        })
        totalForAll += soldCategory.thisCategorySales; 
          
        
        
        counter++;
            if(counter == allSoldCategoryDetails.length){
                categories_sales_list += `<tr>
                <td><b>TOTAL SALES</b></td>
                <td><b>${numberWithCommas(totalForAll)}</b></td>
                <td><b>NO OF CATEGORIES</b></td>
                <td><b>${allSoldCategoryDetails.length}</b></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>

                </tr>`
            }

           
            console.log('this is the counter'+counter+' and this is the length '+allSoldCategoryDetails.length)
        
        });


        console.log('this is main total'+numberWithCommas(totalForAll))
        
        
        $('#categories_sales_list').html(categories_sales_list);
        $('#categorySalesList').DataTable({
            "order": [[1, "desc"]]
            , "autoWidth": true
            ,"retrieve": true
            , "info": true
            , "JQueryUI": true
            , "ordering": false
            , "paging": true,
            "dom": 'Bfrtip',
            "buttons": ['csv', 'excel', 'pdf',]

        });
    }
    })
 }


function loadTransactions() {
  //  console.log('transactions function called')

    let tills = [];
    let users = [];
    let sales = 0;
    let totalTax = 0;
    let transact = 0;
    let unique = 0;

    sold_items = [];
    sold = [];

    let counter = 0;
    let errCount = 0;
    let transaction_list = '';
    let transaction_summary = '';

    let query = `by-date?start=${start_date}&end=${end_date}&user=${by_user}&status=${by_status}&till=${by_till}`;


    $.get(api + query, function (transactions) {
        console.log('these are all transactions' + JSON.stringify(transactions))
        if (transactions.length > 0) {
            $('#transaction_list').empty();
           // $('#transactionList').DataTable().destroy();

            allTransactions = [...transactions];

          //  console.log('these are all transactions'+allTransactions);

            transactions.forEach((trans, index) => {
                

                if(trans.flag =='Connected'){

                sales += parseFloat(trans.total);
                totalTax += parseFloat(trans.tax)

               console.log('transaction no '+index+' sale '+sales+'transaction flag '+trans.flag)

                transact++;

                }
                
                if(trans.flag =='Error'){
                    if(trans.saved == 'true'){
                    sales += 0.0; 
                    totalTax += 0.0;
                }else{
                    transact++;
                    sales += parseFloat(trans.total);
                    totalTax += parseFloat(trans.tax)
             //       console.log('transaction no'+index+'sale'+sales+'transaction flag'+trans.flag)

                }
            } 
                 

                trans.items.forEach(item => {

                    if(trans.flag == 'Connected'){
                        sold_items.push(item);
                    }

                    if(trans.flag == 'Error' && trans.saved != 'true'){
                        if(errCount < 10){
                            
                            sold_items.push(item);
                        }
                    }
                   

                });

                
                if (!tills.includes(trans.till)) {
                    tills.push(trans.till);
                }

                if (!users.includes(trans.user_id)) {
                    users.push(trans.user_id);
                }

             

                counter++;

               let items = trans.items;

               let  transactionItems= [];

               items.forEach(item=>{

                let category = allCategories.filter(function (category) {
                    return category._id == item.category;
                });

            //     if(category[0].lenth>0){
            //         let itemcategory = category[0].name;
            //     }
                

            //         transactionItems.push ("<br>name "+ item.itemName+ ", Quantity "+ item.quantity + ", price "+item.price+", category "+itemcategory+"<br>");
                })
                
               
            if(trans.flag == 'Connected'){
                transaction_list += `<tr>
                                <td>${trans.receiptNumber}</td>
                                <td class="nobr">${moment(trans.date).format('YYYY MMM DD hh:mm:ss')}</td>
                                <td>${numberWithCommas(trans.total)}</td>
                                <td>${trans.paid == "" ? "" : numberWithCommas(trans.paid)}</td>
                                 <td>${trans.change}</td>
                                 <td>${trans.tax.toFixed(2)}</td>
                                 <td>${trans.till}</td>
                                <td>${trans.user}</td>
                                <td>${trans.flag}</td>
                                <td><button class="btn btn-dark"><i class="fa fa-save"></i></button></td>
                                <td>${trans.paid == "" ? '<button class="btn btn-dark"><i class="fa fa-search-plus"></i></button>' : '<button onClick="$(this).viewTransaction(' + index + ')" class="btn btn-info"><i class="fa fa-search-plus"></i></button></td>'}</tr>
                    `;
                }else{

                    if(trans.flag == 'Error' && trans.saved != 'true'){
                        transaction_list += `<tr>
                                <td>${trans.receiptNumber}</td>
                                <td class="nobr">${moment(trans.date).format('YYYY MMM DD hh:mm:ss')}</td>
                                <td>${numberWithCommas(trans.total)}</td>
                                <td>${trans.paid == "" ? "" : numberWithCommas(trans.paid)}</td>
                                <td>${trans.change}</td>
                                <td>${trans.tax.toFixed(2)}</td>
                                <td>${trans.till}</td>
                                <td>${trans.user}</td>
                                <td>${trans.flag}</td>
                                <td>${'<button onClick="$(this).saveTransaction('+index+')" class="btn btn-dark"><i class="fa fa-save"></i></button></td>'}
                                <td>${trans.paid == "" ? '<button class="btn btn-dark"><i class="fa fa-search-plus"></i></button>' : '<button onClick="$(this).viewTransaction(' + index + ')" class="btn btn-info"><i class="fa fa-search-plus"></i></button></td>'}</tr>
                                
                    `;
                    errCount++;

                    }

                }
            
                if (counter == transactions.length) {

                    $('#total_sales_1 #counter').text(numberWithCommas(parseFloat(sales).toFixed(2)));
                    $('#total_transactions_1 #counter').text(transact);
                    $('#total_tax_payable #counter').text(numberWithCommas(parseFloat(totalTax).toFixed(2)));
                    $('#trans_currency').text(settings.symbol);
                    

                    transaction_list += `<tr>
                    <td style = "background-colo:green"><b>TOTAL SALES: ${numberWithCommas(parseFloat(sales).toFixed(2))}</b></td>
                    <td><b>TOTAL TAX PAYABLE: ${numberWithCommas(parseFloat(totalTax).toFixed(2))}</b></td>
                    <td><b>NO OF TRANSACTIONS: ${numberWithCommas(transact)}</b></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    </tr>       
        `;


                    // transaction_summary += 
                    // `<tr>
                    // <td>${numberWithCommas(parseFloat(sales).toFixed(2))}</td>
                    // <td>${numberWithCommas(parseFloat(sales*0.15).toFixed(2))}</td>
                    // <td>${transact}</td>
                    // `
                    const result = {};
              //      console.log('these are sold items'+JSON.stringify(sold_items))
                    for (const { itemName, price, quantity, id, category,itemId } of sold_items) {
                        if (!result[id]) result[id] = [];
                        result[id].push({ id, price, itemName, quantity, category,itemId });
                    }

                    for (item in result) {

                        let price = 0;
                        let itemName ='';
                        let quantity = 0;
                        let id = 0;
                        let category = "";
                        let itemId = 0;

                        result[item].forEach(i => {
                            id = i.id;
                            price = i.price;
                            itemName = i.itemName
                            quantity += i.quantity;
                            category = i.category;
                            itemId=i.itemId;
                        });

                        sold.push({
                            id: id,
                            itemName: itemName,
                            qty: quantity,
                            price: price,
                            category: category,
                            itemId:itemId,
                        });
                    }

               //    loadSoldProducts();
                  //  loadSoldCategoryList()


                    if (by_user == 0 && by_till == 0) {

                        userFilter(users);
                        tillFilter(tills);
                    }

                
                    $('#transaction_list').html(transaction_list);
                    $('#transactionList').DataTable({
                        "order": [[1, "desc"]]
                        ,"autoWidth": false
                        ,"retrieve": true
                        ,"info": true
                        ,"JQueryUI": true
                        ,"ordering": true
                        ,"paging": true,
                        "dom": 'Bfrtip',
                        "buttons": ['csv', 'excel', 'pdf',]

                    });

                    
                }
            });
        }
        else {
            Swal.fire(
                'No data!',
                'No transactions available within the selected criteria',
                'warning'
            );
        }

    });
}


function discend(a, b) {
    if (a.qty > b.qty) {
        return -1;
    }
    if (a.qty < b.qty) {
        return 1;
    }
    return 0;
}





function userFilter(users) {

    $('#users').empty();
    $('#users').append(`<option value="0">All</option>`);

    users.forEach(user => {
        let u = allUsers.filter(function (usr) {
            return usr._id == user;
        });

        $('#users').append(`<option value="${user}">${u[0].fullname}</option>`);
    });

}




function tillFilter(tills) {

    $('#tills').empty();
    $('#tills').append(`<option value="0">All</option>`);
    tills.forEach(till => {
        $('#tills').append(`<option value="${till}">${till}</option>`);
    });

}

$.fn.saveTransaction = function (index) {
    allTransactions[index].saved = "true";
    let data = allTransactions[index];
//console.log('this is data string'+JSON.stringify(data));
   
$.ajax({
        url: api + 'new',
        type: 'PUT',
        data: JSON.stringify(data),
        contentType: 'application/json; charset=utf-8',
        cache: false,
        processData: false,
        success: function (data) {
            console.log('returned response after saving '+ data);
            Swal.fire("Transaction saved!");
            
        }, error: function (data) {
            Swal.fire("Something went wrong!", 'Please refresh this page and try again'+JSON.stringify(data));
        }
    });
}


$.fn.viewTransaction = function (index) {

    transaction_index = index;

    let discount = allTransactions[index].discount;
    let customer = allTransactions[index].customer == 0 ? 'Walk in Customer' : allTransactions[index].customer.username;
    let refNumber = allTransactions[index].ref_number != "" ? allTransactions[index].ref_number : allTransactions[index].order;
    let orderNumber = allTransactions[index].flag == 'Error'? allTransactions[index].order:allTransactions[index].receiptNumber ;
    let type = "";
    let tax_row = "";
    let items = "";
    let products = allTransactions[index].items;
    let total_without_tax = 0.0;

    products.forEach(item => {
        items += "<tr><td>" + item.itemName + "</td><td>" + item.quantity + "</td><td> "+ numberWithCommas(parseFloat(item.price).toFixed(2)) + "</td></tr>";

    });

    

    switch (allTransactions[index].payment_type) {

        case 2: type = "Card";
            break;

        default: type = "Cash";

    }


    if (allTransactions[index].paid != "") {
        payment = `<tr>
                    <td>Paid</td>
                    <td>:</td>
                    <td>${settings.symbol + allTransactions[index].paid}</td>
                </tr>
                <tr>
                    <td>Change</td>
                    <td>:</td>
                    <td>${settings.symbol + Math.abs(allTransactions[index].change).toFixed(2)}</td>
                </tr>
                <tr>
                    <td>Method</td>
                    <td>:</td>
                    <td>${type}</td>
                </tr>`
    }



    if (settings.charge_tax) {
        let taxAmount = parseFloat(allTransactions[index].tax).toFixed(2);
         total_without_tax = numberWithCommas(allTransactions[index].subtotal-taxAmount);
        tax_row = `<tr>
                <td>Vat(${settings.percentage})% </td>
                <td>:</td>
                <td>${settings.symbol}${taxAmount}</td>
            </tr>`;
    }else{
        total_without_tax = numberWithCommas(allTransactions[index].subtotal);
    }




    receipt = `<div style="font-size: 10px;">                            
    <p style="text-align: center;">
    ${settings.img == "" ?'<img style="max-width: 50px;max-width: 50px;" src ="assets/images/zrb_logo.png" /><br>' : '<img style="max-width: 50px;max-width: 50px;" src ="assets/images/zrb_logo.png" /><br>'}
        <span style="font-size: 10px;">TAX PAYER: ${settings.store}</span> <br>
        Z NUMBER:  ${settings.zNumber} <br>
        TIN:  ${settings.tinNumber}<br>
        VRN: ${settings.vrnNumber} <br>
        STREET: ${settings.address_one}
        </p>
        <hr>
    <left>
        <p>
        Invoice : ${orderNumber} <br>
        Ref No : ${refNumber} <br>
        Customer : ${allTransactions[index].customer == 0 ? 'Walk in Customer' : allTransactions[index].customer.name} <br>
        Cashier : ${allTransactions[index].user} <br>
        Date : ${moment(allTransactions[index].date).format('DD MMM YYYY HH:mm:ss')}<br>
        </p>

    </left>
    <hr>
    <table width="100%">
        <thead style="text-align: left;">
        <tr>
            <th>Item</th>
            <th>Qty</th>
            <th>Price ${settings.symbol}</th>
        </tr>
        </thead>
        <tbody>
        ${items}  
        </tbody>
                      
        <tr>                        
            <td>Total Tax Excl.</td>
            <td>:</td>
            <td>${ total_without_tax}</td>
        </tr>    
        ${tax_row}
    
        <tr>
            <td><b>Total</b></td>
            <td><b>:</b></td>
            <td>
                <b>${numberWithCommas(allTransactions[index].total)}</b>
            </td>
        </tr>
        ${payment == 0 ? '' : numberWithCommas(payment)}
        </tbody>
        </table>
        <hr>
        <br>
        <p style="text-align: center;">
            <img src = 'assets/images/qrcodeImage.png' style = "max-width: 100px; max-height: 100px"/>
         </p>
        </div>`;

    $('#viewTransaction').html('');
    $('#viewTransaction').html(receipt);

    $('#orderModal').modal('show');

}


$('#status').change(function () {
    by_status = $(this).find('option:selected').val();
    loadTransactions();
});



$('#tills').change(function () {
    by_till = $(this).find('option:selected').val();
    loadTransactions();
});


$('#users').change(function () {
    by_user = $(this).find('option:selected').val();
    loadTransactions();
});


$('#reportrange').on('apply.daterangepicker', function (ev, picker) {

    start = picker.startDate.format('DD MMM YYYY hh:mm A');
    end = picker.endDate.format('DD MMM YYYY hh:mm A');

    start_date = picker.startDate.toDate().toJSON();
    end_date = picker.endDate.toDate().toJSON();


    loadTransactions();
});


function authenticate() {
    $('#loading').append(
        `<div id="load"><form id="account"><div class="form-group"><input type="text" placeholder="Username" name="username" class="form-control"></div>
        <div class="form-group"><input type="password" placeholder="Password" name="password" class="form-control"></div>
        <div class="form-group"><input type="submit" class="btn btn-block btn-default" value="Login"></div></form>`
    );
}


$('body').on("submit", "#account", function (e) {
    e.preventDefault();
    let formData = $(this).serializeObject();

    if (formData.username == "" || formData.password == "") {

        Swal.fire(
            'Incomplete form!',
            auth_empty,
            'warning'
        );
    }
    else {

        $.ajax({
            url: api + 'users/login',
            type: 'POST',
            data: JSON.stringify(formData),
            contentType: 'application/json; charset=utf-8',
            cache: false,
            processData: false,
            success: function (data) {
                if (data._id) {
                    storage.set('auth', { auth: true });
                    storage.set('user', data);
                    ipcRenderer.send('app-reload', '');
                }
                else {
                    Swal.fire(
                        'Oops!',
                        auth_error,
                        'warning'
                    );
                }

            }, error: function (data) {
                console.log(data);
            }
        });
    }
});


$('#quit').click(function () {
    Swal.fire({
        title: 'Are you sure?',
        text: "You are about to close the application.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Close Application'
    }).then((result) => {

        if (result.value) {
            ipcRenderer.send('app-quit', '');
        }
    });
});

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}




