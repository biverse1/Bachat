var mySql= require('mysql');
var express= require('express');
var bodyparser=require('body-parser');
var urlencoded=bodyparser.urlencoded({extended:false});
var app=express();
var path=require('path');
app.use('/assets',express.static(path.join(__dirname,'/assets/')));
var session = require('express-session');
app.use(session({secret: "Shh, its a secret!"}));
var bodyParser = require('body-parser');
var urlencoded=bodyParser.urlencoded({ extended: true });
var {google} = require('googleapis');
var validator=require('express-validator');
app.use(validator());
var connection= mySql.createConnection({host:'bachetbachet.cskw1efu7hwo.us-east-1.rds.amazonaws.com',user:'root',password:'root1234',database:'bachet'});
app.set('view engine','ejs');

connection.connect(function (err) {
  if(err){
    throw err;
  }
  else {
    console.log('the connection has been made with the database');
  }
});
//renders login page
app.get('/login',urlencoded,function(req,res){

  res.render('login',{message:true})
});
//renders welcome page

app.get('/welcome',function(req,res){
  res.render('welcome')
});

//renders registration page
app.get('/registration',function(req,res){
  res.render('registration',{flag:true})
});
//renders about page
app.get('/about',function(req,res) {

  if(req.session.theUser){
     res.render('about',{flag:true});
  }
  else{
    res.render('about',{flag:false});
  }

});
app.get('/about1',function(req,res) {
  var sql= "select * from CustomerInfo where 	EMAIL='ntathe@gmail.com'";
  connection.query(sql,function(err,result){
    if(err) throw err;
    console.log(result[0].Income);
    req.session.theUser=result[0].EMAIL;
    req.session.income=result[0].Income;
    console.log(req.session.income);
    res.render('about',{flag:true,income:req.session.income});

  });




});

//updates password or reset password
app.post('/resetpassword',urlencoded,function(req,res) {
  req.assert('email','Invalid Email').trim().isEmail();
  req.assert('psw','Invalid Password').trim().matches(/^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]*$/);
  var errors=req.validationErrors();
  if(errors){
    res.render('login',{message:false});
  }else{
  console.log(req.body.email);
  console.log(req.body.psw);
  var sql="UPDATE CustomerInfo SET PASSWORD = '"+req.body.psw+"' WHERE EMAIL='"+req.body.email+"'" ;
  connection.query(sql,function(err,result){
    if(err) throw err;
    res.render('login',{message:true});
  })
}
});
app.post('/registration',urlencoded,function(req,res) {
  console.log(req.body.psw);
  // var trail="Select * from CustomerInfo where EMAIL='"+req.body.email+"' "
  // connection.query(trail,function(err,rows){
  //   if(rows.length==0){
  //     console.log("Bari holu");
  //   }
  //   else{
  //     console.log("u");
  //   }
  // })
  //console.log(req.body.pswrepeat);

  if(req.body.psw === req.body.pswrepeat){
    var sql= "INSERT INTO CustomerInfo (FIRSTNAME,LASTNAME,EMAIL,PASSWORD) VALUES ('"+req.body.firstname+"', '"+req.body.lastname+"','"+req.body.email+"','"+req.body.psw+"')";
    connection.query(sql,function(err,result){
      if(err) {
        res.render('registration',{flag:false})
      }else{res.render('login',{message:true});}

    })
  }
  else{
     res.render('registration',{flag:false});
  }


});

app.get('/resetpassword',function(req,res){
   res.render('resetpassword');
});
//the below methos logins in the user once the credential verification is done
app.post('/login',urlencoded,function(req,res){
  req.assert('email','Invalid Email').trim().isEmail();
  req.assert('psw','Invalid Password').trim().matches(/^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]*$/);
  var errors=req.validationErrors();
  if(errors){
    res.render('login',{message:false});
  }else{
  req.session.theUser=req.body.email;
  req.session.income;
  console.log(req.body.email);
  // var check="select income from customerinfo where EMAIL='"+req.body.email+"'";
  // connection.query(check,function(err,result){
  //   console.log(result.length);
  //   if(result.length===0){
  //     res.send("Something is wrong");
  //   }else{
  //     req.session.income=result[0].Income;
  //   }
  //
  // })
  var sql= "select * from CustomerInfo where 	EMAIL='"+req.body.email+"' and PASSWORD='"+req.body.psw+"' ";
  connection.query(sql,function(err,result){

    if(err) throw err;

    if(result.length>0){
      req.session.cusid= result[0].CUSTOMERID;
      req.session.income=result[0].Income;
      console.log(req.session.cusid);
       res.render('about',{flag:true,income:req.session.income });
    }
    else{
      res.render('login',{message:false});
    }
  })
}

});
//shows the budget
app.get('/expenses',function(req,res){
  if(req.session.theUser){
  console.log(req.session.income);
  var sql="select CUSTOMERID from CustomerInfo where EMAIL='"+req.session.theUser+"'";
  connection.query(sql,function(err,result){
    if(err) throw err;
    console.log(result[0].CUSTOMERID);
    req.session.cusid= result[0].CUSTOMERID;
    var abc ="select TYPENAME , AMOUNT from ExpenseType inner join ExpenseDetails on EXPENSEID=TYPEID where CUSTOMERID='"+result[0].CUSTOMERID+"'";
    connection.query(abc,function(err,rows){
      if(err) throw err;
      req.session.budget=rows;
      if(req.session.budget.length !=0){

      var sum=0;
      var n=req.session.budget.length;
      console.log(req.session.budget[0].AMOUNT);
      for(var i=0;i<n;i++){
          sum=sum+req.session.budget[i].AMOUNT;
      }
      console.log(sum);
      res.render('expenses',{budget:req.session.budget,sum:sum,income:req.session.income});
    }
    else{
      res.render('expenses',{budget:req.session.budget,sum:0,income:req.session.income});
    }
    })
  })
}
else {
  res.render('login',{message:true});
}
});

app.get('/addincome',function(req,res){
  res.render('addincome');
});

app.post('/expenses1',urlencoded,function(req,res){
  console.log(req.body.income);
  var sql="UPDATE CustomerInfo SET Income= '"+req.body.income+"' WHERE EMAIL = '"+req.session.theUser+"'";
  connection.query(sql,function(err,result){
    if(err) throw err;
    console.log(req.session.cusid);
    var abc ="select TYPENAME , AMOUNT from ExpenseType inner join ExpenseDetails on EXPENSEID=TYPEID where CUSTOMERID='"+req.session.cusid+"'";
    connection.query(abc,function(err,rows){
      if(err) throw err;
      req.session.budget=rows;
      if(req.session.budget.length !=0){

      var sum=0;
      var n=req.session.budget.length;
      console.log(req.session.budget[0].AMOUNT);
      for(var i=0;i<n;i++){
          sum=sum+req.session.budget[i].AMOUNT;
      }
      console.log(sum);
      res.render('expenses',{budget:req.session.budget,sum:sum,income:req.session.income});
    }
    else{
      res.render('expenses',{budget:req.session.budget,sum:0,income:req.session.income});
    }
    })


  });
});


app.post('/crud',urlencoded,function(req,res){
    var actionParameter=req.body;
    console.log(actionParameter.update);
    console.log(req.session.cusid);
    if(actionParameter.update){
          var sql="select TYPENAME , AMOUNT from ExpenseType inner join ExpenseDetails on EXPENSEID=Typeid where CUSTOMERID='"+req.session.cusid+"' and Typename='"+actionParameter.update+"' "
          connection.query(sql,function(err,result){
            if(err) throw err;
            console.log(result);


              res.render('updateexpense',{sol:result});


          });

    }
    else if (actionParameter.delete) {
      var sql="call dummy('"+actionParameter.delete+"','"+req.session.theUser+"')";
      connection.query(sql,function(err,result){
        if(err) throw err;
        var abc="select TYPENAME , AMOUNT from ExpenseType inner join ExpenseDetails on EXPENSEID=TYPEID where CUSTOMERID='"+req.session.cusid+"'";
        connection.query(abc,function(err,rows){
          if(err) throw err;

          req.session.budget=rows;
          var sum=0;
          var n=req.session.budget.length;
          //console.log(req.session.budget[0].AMOUNT);
          if(n>0){
            for(var i=0;i<n;i++){
                sum=sum+req.session.budget[i].AMOUNT;
            }
            console.log(sum);
          }

          res.render('expenses',{budget:req.session.budget,sum:sum,income:req.session.income});
        })
      })

    }
    else{
      if(req.session.budget.length !=0){
      var sql="select Typename from ExpenseType";
      connection.query(sql,function(err,result){
        if(err) throw err;
        var newlist=[];
        var checklist=[];
        for(var s=0; s<req.session.budget.length;s++){
          newlist.push(req.session.budget[s].TYPENAME);
         }
         for(var i=0;i<result.length;i++){
           checklist.push(result[i].Typename);
         }
         var finallist=[];
         finallist = checklist.filter(function(val) {
   return newlist.indexOf(val) == -1;
     });

     console.log(newlist);
     console.log(checklist);
     console.log(finallist);

        res.render('addition',{result:finallist});
      });
    } else{
      var sql="select Typename from ExpenseType";
      connection.query(sql,function(err,result){
        if(err) throw err;
        var finallist=[]
        for(var i=0;i<result.length;i++){
          finallist.push(result[i].Typename);
        }
        res.render('addition',{result:finallist});
    })



    }
}
});



app.post('/update',urlencoded,function(req,res){

  var sql="call updation('"+req.body.update+"','"+req.session.theUser+"','"+req.body.new+"')";
  connection.query(sql,function(err,result){
    if(err) throw err;
    var abc="select TYPENAME , AMOUNT from ExpenseType inner join ExpenseDetails on EXPENSEID=TYPEID where CUSTOMERID='"+req.session.cusid+"'";
    connection.query(abc,function(err,rows){
      if(err) throw err;

      req.session.budget=rows;
      var sum=0;
      var n=req.session.budget.length;
      console.log(req.session.budget[0].AMOUNT);
      for(var i=0;i<n;i++){
          sum=sum+req.session.budget[i].AMOUNT;
      }
      console.log(sum);
      res.render('expenses',{budget:req.session.budget,sum:sum,income:req.session.income});
    })

  });

});
app.post('/addition',urlencoded,function(req,res){
  var sql="call addition('"+req.body.type+"','"+req.session.theUser+"','"+req.body.val+"')";

  connection.query(sql,function(err,result){
    if(err) throw err;
    var abc="select TYPENAME , AMOUNT from ExpenseType inner join ExpenseDetails on EXPENSEID=TYPEID where CUSTOMERID='"+req.session.cusid+"'";
    connection.query(abc,function(err,rows){
      if(err) throw err;

      req.session.budget=rows;
      var sum=0;
      var n=req.session.budget.length;
      console.log(req.session.budget[0].AMOUNT);
      for(var i=0;i<n;i++){
          sum=sum+req.session.budget[i].AMOUNT;
      }
      console.log(sum);
      res.render('expenses',{budget:req.session.budget,sum:sum,income:req.session.income});
    })

})
});

app.get('/signout',function(req,res){
  req.session.destroy();
  res.render('login',{message:true});
});

app.get('/dummy',function(req,res){
  res.render('dummy');
});

app.get('/team',function(req,res){
  if(req.session.theUser){
    res.render('team',{flag:true});
  }
  else{
    res.render('team',{flag:false});
  }

});

app.get('/contact',function(req,res){
  if(req.session.theUser){
    res.render('contact',{flag:true});
  }
  else{
    res.render('contact',{flag:false});
  }
})


app.listen(8080,'127.0.0.1');
