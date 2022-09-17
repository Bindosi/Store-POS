let cart = [];
let salesItems = [];
let index = 0;
let allUsers = [];
let allProducts = [];
let allCategories = [];
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
let Inventory = require("../../api/inventory");

let host = 'localhost';
const QRCode = require('qrcode');
let path = require('path');
let port = '8001';
let moment = require('moment');
let Swal = require('sweetalert2');
let { ipcRenderer } = require('electron');
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



    $(document).ready(function () {

        $(".loading").hide();

        loadCategories();
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
        if (0 == user.perm_users) { $(".p_four").hide() };
        if (0 == user.perm_settings) { $(".p_five").hide() };

        function loadProducts() {

            $.get(api + 'inventory/products', function (data) {
                console.log('this are all the products in the system'+ JSON.stringify(data));
                data.forEach(item => {
                let  price = parseFloat(item.price);
                     item.price = numberWithCommas(price);
                     category = item.category;
                });

                allProducts = [...data];

                loadProductList();

                $('#parent').text('');
                $('#categories').html(`<button type="button" id="all" class="btn btn-categories btn-white waves-effect waves-light">All</button> `);

                data.forEach(item => {

                    if (!categories.includes(item.category)) {
                        categories.push(item.category);
                    }

                    let item_info = `<div class="col-lg-4 box ${item.category}"
                                onclick="$(this).addToCart(${item._id}, ${item.quantity}, ${item.stock})">
                            <div class="widget-panel widget-style-2 ">                    
                            <div id="image"><img src="${item.img == "" ? "./assets/images/default.jpg" : img_path + item.img}" id="product_img" alt=""></div>                    
                                        <div class="text-muted m-t-5 text-center">
                                        <div class="name" id="itemName">${item.name}</div> 
                                        <span class="sku">${item.sku}</span>
                                        <span class="stock">STOCK </span><span class="count">${item.stock == 1 ? item.quantity : 'N/A'}</span></div>
                                        <sp class="text-success text-center"><b data-plugin="counterup">${settings.symbol + " "+ numberWithCommas(item.price)}</b> </sp>
                            </div>
                        </div>`;
                    $('#parent').append(item_info);
                });

                categories.forEach(category => {

                    let c = allCategories.filter(function (ctg) {
                        return ctg._id == category;
                    })

                    $('#categories').append(`<button type="button" id="${category}" class="btn btn-categories btn-white waves-effect waves-light">${c.length > 0 ? c[0].name : ''}</button> `);
                });

            });

        }

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

            if (stock == 1) {
                if (count > 0) {
                    $.get(api + 'inventory/product/' + id, function (data) {
                        console.log('this is the product data'+ JSON.stringify(data));
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
                    $(this).addProductToCart(data);
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
                itemId: 0,
                category: data.category,
                discount: 0,
                itemName: data.name,
                sku: data.sku,
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


        $.fn.setIndex = function (value) {
            index = value;
        }


        $.fn.calculateCart = function () {
            let total = 0;
            let grossTotal;
            let vatExclusive = 0;
            $('#total').text(cart.length);
            $.each(cart, function (index, data) {
                total += data.quantity * data.price;
            });
            total = total - $("#inputDiscount").val();
            
            $('#price').text(settings.symbol + " " + numberWithCommas(total));

            subTotal = total;

            if ($("#inputDiscount").val() >= total) {
                $("#inputDiscount").val(0);
            }

            if (settings.charge_tax) {
                totalVat = ((total * vat) / 100);
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


        $.fn.qtIncrement = function (i) {

            item = cart[i];

            let product = allProducts.filter(function (selected) {
                return selected._id == parseInt(item.id);
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
                            console.log("File", qrImage)
                        })
                    } catch (err) {
                        console.error(err)
                      }
            }


        $.fn.submitDueOrderOnline  = async function (status) {
            let items = "";
            let payment = 0;

            cart.forEach(item => {

                items += "<tr><td>" + item.itemName + "</td><td>" + item.quantity + "</td><td>" + settings.symbol + " " + numberWithCommas(parseFloat(item.price).toFixed(2)) + "</td></tr>";

            });

            let currentTime = new Date(moment());
            let customer = JSON.parse($("#customer").val());
            let date = moment(currentTime).format("YYYY-MM-DD HH:mm:ss");
            let refNumber = $("#refNumber").val();
            let paid = $("#payment").val() == "" ? "" : " "+ numberWithCommas (parseFloat($("#payment").val()).toFixed(2));
            let discount = $("#inputDiscount").val();
            let salesCustomer = $("#salesCustomerName").val();
            let phoneNumber = $("#salesCustomerPhone").val();
            let change = $("#change").text() == "" ? "" : parseFloat($("#change").text()).toFixed(2);
            let orderNumber = holdOrder;
            let type = "";
            let tax_row = "";
          
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
                        <td>${settings.symbol + " "+ numberWithCommas(paid)}</td>
                    </tr>
                    <tr>
                        <td>Change</td>
                        <td>:</td>
                        <td>${settings.symbol + " "+ numberWithCommas(Math.abs(change).toFixed(2))}</td>
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
                referenceNumber: "ZRBT"+orderNumber,
                salesCurrency: settings.symbol,
                salesCustomer: salesCustomer,
                salesItems: cart,
            }
            console.log("customer Query"+ JSON.stringify(customerQuery));
            

            $.ajax({
                url: 'http://102.223.7.131:6060/vfms/api/sales/',
                headers: {'Content-Type': 'application/json','vfms-request-type': 'NORMAL_SALES','vfms-intergration-id': '601850253','vfms-token-id': 'e356de19-b1e6-47d9-82e0-eff7ad5fed5c'},
                type: 'POST',
                data: JSON.stringify(customerQuery),
                contentType: 'application/json; charset=utf-8',
                cache: false,
                processData: false,
                success: async  function (responseData) {
                
                $("#receiptLoading").hide();
                
                var json = JSON.parse(JSON.stringify(responseData));
               
                 console.log("This is returned response"+ json);
                  await generateQR("https://portalvfms.zanrevenue.org/receipt-form/"+json.receiptNumber.toString());
                  await $.fn.receiptAndSave(json);
                },error: function (responseData) {
                    $("#receiptLoading").hide();
                    $("#dueModal").modal('toggle');
                    Swal.fire("Something went wrong!", 'Please refresh this page and try again');

                }
            
            });
        
    
            $.fn.receiptAndSave =  function(json){
                let date = json.issueDate; 
                let paidZRB = json.receitpAmount;
                let currentTime = json.issueDate;
                let customer = json.salesCustomer;
                let refNumber = json.referenceNumber;
                let receiptNumber = json.receiptNumber;

                let data = {
                    order: "ZRBT"+orderNumber,
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
                    _id: "ZRB"+orderNumber,
                    till: platform.till,
                    mac: platform.mac,
                    user: user.fullname,
                    user_id: user._id
                }
    
          


            if (settings.charge_tax) {
                tax_row = `<tr>
                    <td>Vat(${settings.percentage})% </td>
                    <td>:</td>
                    <td>${settings.symbol}${" "+ numberWithCommas(parseFloat(json.taxAmount).toFixed(2))}</td>
                </tr>`;
            }
    
                receipt = `<div style="font-size: 10px;">                            
                <p style="text-align: center;">
                    ${settings.img == "" ?'<img style="max-width: 50px;max-width: 50px;" src ="assets/images/zrb_logo.png" /><br>' : '<img style="max-width: 50px;max-width: 50px;" src ="assets/images/zrb_logo.png" /><br>'}
                        <span style="font-size: 16px;">TAX PAYER: ${json.businessName}</span> <br>
                        Z NUMBER:  ${json.znumber} <br>
                        TIN:  ${json.tinNumber}<br>
                        VRN: ${json.vrnNumber} <br>
                        STREET: ${json.street}
                        </p>
                        <hr>
                        <left>
                            <p>
                            Ref No : ${refNumber} <br>
                            Customer Name : ${json.salesCustomer} <br>
                            Cashier : ${user.fullname} <br>
                            Currency : ${json.salesCurrency}<br>
                            Issue Date : ${date}<br>
                            Phone Number:${phoneNumber}
                            </p>
                        </left>
                        <hr>
                        <table width="100%">
                            <thead style="text-align: left;">
                            <tr>
                                <th>Item</th>
                                <th>Qty</th>
                                <th>Price</th>
                            </tr>
                            </thead>
                            <tbody>
                            ${items}                
                    
                            <tr>                        
                                <td><b>Total Tax Excl.</b></td>
                                <td>:</td>
                                <td><b>${json.salesCurrency}${" "+ numberWithCommas(json.taxExclussive.toFixed(2))}</b></td>
                            </tr>
                            <tr>
                                <td>Discount</td>
                                <td>:</td>
                                <td>${discount > 0 ? settings.symbol + " "+numberWithCommas (parseFloat(discount).toFixed(2)) : ''}</td>
                            </tr>
                            
                            ${tax_row}
                        
                            <tr>
                                <td><h4>Total Amount: </h4></td>
                                <td><h4>:</h4></td>
                                <td>
                                    <h4>${settings.symbol} ${" " + numberWithCommas(parseFloat(paidZRB).toFixed(2))}</h3>
                                </td>
                            </tr>
                            ${payment == 0 ? '' : payment}
                            </tbody>
                            </table>
                            <br>
                            <hr>
                            <br>
                            <p style="text-align: center;">
                            <img src = 'assets/images/qrcodeImage.png'/>
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
    
    
                console.log('this is data returned after save'+ JSON.stringify(data));
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

            cart.forEach(item => {

                items += "<tr><td>" + item.itemName + "</td><td>" + item.quantity + "</td><td>" + settings.symbol + " " + numberWithCommas(parseFloat(item.price).toFixed(2)) + "</td></tr>";

            });

            let currentTime = new Date(moment());

            let discount = $("#inputDiscount").val();
            let customer = JSON.parse($("#customer").val());
            let date = moment(currentTime).format("YYYY-MM-DD HH:mm:ss");
            let paid = $("#payment").val() == "" ? "" : parseFloat($("#payment").val()).toFixed(2);
            let change = $("#change").text() == "" ? "" : parseFloat($("#change").text()).toFixed(2);
            let refNumber = $("#refNumber").val();
            let orderNumber = holdOrder;
            let type = "";
            let tax_row = "";
            let network_status = "success";


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
                        <td>${settings.symbol + paid}</td>
                    </tr>
                    <tr>
                        <td>Change</td>
                        <td>:</td>
                        <td>${settings.symbol + Math.abs(change).toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td>Method</td>
                        <td>:</td>
                        <td>${type}</td>
                    </tr>`
            }



            if (settings.charge_tax) {
                tax_row = `<tr>
                    <td>Vat(${settings.percentage})% </td>
                    <td>:</td>
                    <td>${settings.symbol}${parseFloat(totalVat).toFixed(2)}</td>
                </tr>`;
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
        ${settings.img == "" ? settings.img : '<img style="max-width: 50px;max-width: 100px;" src ="' + img_path + settings.img + '" /><br>'}
            <span style="font-size: 22px;">${settings.store}</span> <br>
            ${settings.address_one} <br>
            ${settings.address_two} <br>
            ${settings.contact != '' ? 'Tel: ' + settings.contact + '<br>' : ''} 
            ${settings.tax != '' ? 'Vat No: ' + settings.tax + '<br>' : ''} 
        </p>
        <hr>
        <left>
            <p>
            Order No : ${orderNumber} <br>
            Ref No : ${refNumber == "" ? orderNumber : refNumber} <br>
            Customer : ${customer == 0 ? 'Walk in customer' : customer.name} <br>
            Cashier : ${user.fullname} <br>
            Date : ${date}<br>
            </p>

        </left>
        <hr>
        <table width="100%">
            <thead style="text-align: left;">
            <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Price</th>
            </tr>
            </thead>
            <tbody>
            ${items}                
     
            <tr>                        
                <td><b>Subtotal</b></td>
                <td>:</td>
                <td><b>${settings.symbol}${" "+ numberWithCommas(subTotal.toFixed(2))}</b></td>
            </tr>
            <tr>
                <td>Discount</td>
                <td>:</td>
                <td>${discount > 0 ? settings.symbol + " "+numberWithCommas (parseFloat(discount).toFixed(2)) : ''}</td>
            </tr>
            
            ${tax_row}
        
            <tr>
                <td><h3>Total</h3></td>
                <td><h3>:</h3></td>
                <td>
                    <h3>${settings.symbol} ${" " +numberWithCommas(parseFloat(orderTotal).toFixed(2))}</h3>
                </td>
            </tr>
            ${payment == 0 ? '' : payment}
            </tbody>
            </table>
            <br>
            <hr>
            <br>
            <p style="text-align: center;">
                <img src = 'assets/images/qrcodeImage.png'/>
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
                order: "ZRBT"+orderNumber,
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
                _id: "ZRBT"+orderNumber,
                till: platform.till,
                mac: platform.mac,
                user: user.fullname,
                user_id: user._id,
                flag: network_status,
            }
            console.log('this is data returned after save'+ JSON.stringify(data));
            let offlineOrderNumber = "ZRBT"+orderNumber;
            $.ajax({
                url: api + 'new',
                type: method,
                data: JSON.stringify(data),
                contentType: 'application/json; charset=utf-8',
                cache: false,
                processData: false,
                success: async function (data, offlineOrderNumber) {
                   
                    await generateQR("https://portalvfms.zanrevenue.org/receipt-form/"+ offlineOrderNumber.toString());
                    await $('#viewTransaction').html(receipt);

                    cart = [];
                    $('#viewTransaction').html('');
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

            let vat = (totalPrice * data.vat) / 100;
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
                        itemId: 0,
                        discount: 0,
                        itemName: product.itemName,
                        sku: product.sku,
                        price: product.price,
                        quantity: product.quantity
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
                        itemId: 0,
                        discount: 0,
                        itemName: product.itemName,
                        sku: product.sku,
                        price: product.price,
                        quantity: product.quantity
                    };
                    cart.push(item);
                })
            }
            $(this).renderTable(cart);
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



        $.fn.getCustomerOrders = function () {
            $.get(api + 'customer-orders', function (data) {
                clearInterval(dotInterval);
                customerOrderList = data;
                customerOrderLocation.empty();
                $(this).randerHoldOrders(customerOrderList, customerOrderLocation, 2);
            });
        }

        
        $.fn.deleteAllTransactions = function () {
            $.get(api + 'deleteTransactions', function (data) {
                console.log('all transactions data deleted');
                console.log('operation status'+data);
            });
        }

        $('#deleteAllTransactions').click(function () {

            $.fn.deleteAllTransactions();
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
                $(this).submitDueOrderOffline(1);
            }
        });


        $('#transactions').click(function () {
            loadTransactions();
            loadUserList();

            $('#pos_view').hide();
            $('#pointofsale').show();
            $('#transactions_view').show();
            $(this).hide();

        });


        $('#pointofsale').click(function () {
            $('#pos_view').show();
            $('#transactions').show();
            $('#transactions_view').hide();
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
            $('#saveProduct').get(0).reset();
            $('#current_img').text('');
        });


        $('#saveProduct').submit(function (e) {
            e.preventDefault();

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

            $('#Products').modal('hide');

            $("#category option").filter(function () {
                return $(this).val() == allProducts[index].category;
            }).prop("selected", true);

            $('#productName').val(allProducts[index].name);
            $('#product_price').val(allProducts[index].price);
            $('#quantity').val(allProducts[index].quantity);

            $('#product_id').val(allProducts[index]._id);
            $('#img').val(allProducts[index].img);

            if (allProducts[index].img != "") {

                $('#imagename').hide();
                $('#current_img').html(`<img src="${img_path + allProducts[index].img}" alt="">`);
                $('#rmv_img').show();
            }

            if (allProducts[index].stock == 0) {
                $('#stock').prop("checked", true);
            }

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


                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                