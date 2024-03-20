export default {
  id: "forgotpassword",
  handler: (
    router,
    { services, exceptions, database, schema, logger, getSchema }
  ) => {
    const {
      ItemsService,
      MailService,
      UsersService,
      CollectionsService,
      AuthenticationService,
      AuthorizationService,
      FieldsService,
      PermissionsService,
      ActivityService,
    } = services;
    const { ServiceUnavailableException } = exceptions;

    router.post("/forgot_password", async (req, res) => {
      function generate() {
        var result = "";
        var characters = "0123456789";
        var charactersLength = 6;
        for (var i = 0; i < charactersLength; i++) {
          result += characters.charAt(
            Math.floor(Math.random() * characters.length)
          );
        }
        return result;
      }

      const generatedPin = generate();
      const { email } = req.body;

      const mailer = new MailService({ schema: req.schema });
      const reset = new ItemsService("reset_password", {
        schema: req.schema,
      });

      let time = Date.now();

      database("directus_users")
        .where({
          email: email,
        })
        .then(async (data) => {
          const index = data.findIndex((x) => x.email === email);
          if (index > -1) {
            const mail = await mailer
              .send({
                to: email,
                bcc: "",
                subject: "Password reset",
                template: {
                  name: "password-forgot",
                  data: {
                    pin: generatedPin,
                    projectName: "Hybrid Learning",
                  },
                },
              })
              .then(async () => {
                let c = await reset.createOne({
                  email: email,
                  pin: generatedPin,
                  valid: time,
                });
                if (c) {
                  database("reset_password")
                    .where({
                      id: c,
                    })
                    .then((data) => {
                      let obj = {
                        data: data[0],
                        status: "password_reset_request",
                      };
                      res.send(obj);
                    });
                }
              });
          } else {
            res.send("user_does_not_exist");
          }
        })
        .catch((err) => {
          console.log(err);
        });
    });

    router.post("/pin_reset", async (req, res) => {
      const { pin } = req.body;

      database("reset_password")
        .where({
          pin: pin,
        })
        .then((data) => {
          const index = data.findIndex((x) => x.pin === pin);
          let result = Date.now() - data[index].valid;
          if (index > -1) {
            if (result < 300000) {
              res.send("pin_confirmed");
            } else {
              res.send("pin_expired");
            }
          } else {
            res.send("wrong_pin");
          }
        })
        .catch((err) => {
          console.log(err);
        });
    });

    router.post("/resend", async (req, res) => {
      function generate() {
        var result = "";
        var characters = "0123456789";
        var charactersLength = 6;
        for (var i = 0; i < charactersLength; i++) {
          result += characters.charAt(
            Math.floor(Math.random() * characters.length)
          );
        }
        return result;
      }
      const { email } = req.body;
      let time = Date.now();
      let generatedPin = generate();

      const forgot = new ItemsService("reset_password", {
        schema: req.schema,
      });
      const mailer = new MailService({ schema: req.schema });

      database("reset_password")
        .where({
          email: email,
        })
        .then(async (data) => {
          let index = data.findIndex((x) => x.email === email);
          await mailer
            .send({
              to: email,
              bcc: "",
              subject: "Activation Pin",
              template: {
                name: "pin",
                data: {
                  pin: generatedPin,
                  projectName: "Hybrid Learning",
                },
              },
            })
            .then(async () => {
              let c = await forgot.updateOne(data[index].id, {
                pin: generatedPin,
                valid: time,
              });
              if (c) {
                database("reset_password")
                  .where({
                    id: c,
                  })
                  .then((data) => {
                    let obj = {
                      status: "sended",
                    };
                    res.send(obj);
                  });
              }
            });
        })
        .catch((err) => {
          console.log(err);
        });
    });

    router.post("/update_password", async (req, res) => {
      const { password, pin } = req.body;

      const users = new UsersService({
        schema: req.schema,
        collection: "directus_users",
      });

      const forgot = new ItemsService("reset_password", {
        schema: req.schema,
      });

      let id;

      database("reset_password")
        .where({
          pin: pin,
        })
        .then((data) => {
          const index = data.findIndex((x) => x.pin === pin);
          const email = data[index].email;
          id = data[index].id;
          database("directus_users")
            .where({
              email: email,
            })
            .then(async (data2) => {
              const index = data2.findIndex((x) => x.email === email);
              if (index > -1) {
                const user = await users.updateOne(data2[index].id, {
                  password: password,
                });
                if (user) {
                  database("reset_password")
                    .where({
                      id: id,
                    })
                    .then(async (data3) => {
                      let obj = {
                        status: "password_updated",
                      };
                      await forgot.deleteOne(id);
                      res.send(obj);
                    });
                }
              } else {
                res.send("something_went_wrong");
              }
            });
        })
        .catch((err) => {
          console.log(err);
        });
    });
  },
};
