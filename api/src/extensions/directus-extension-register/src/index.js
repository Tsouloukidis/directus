export default {
  id: "register",
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

    router.post("/registration", async (req, res) => {
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
      const { firstName, lastName, email } = req.body;
      console.log(firstName);
      console.log(lastName);
      console.log(email);

      let validRegex =
        /(?:[a-z0-9+!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/gi;
      let generatedPin = generate();
      let time = Date.now();

      const register = new ItemsService("new_registration", {
        schema: req.schema,
      });
      const mailer = new MailService({ schema: req.schema });

      if (email.match(validRegex)) {
        database("new_registration")
          .where({
            email: email,
          })
          .then((data) => {
            if (data.length > 0) {
              res.send("registration_exists");
            } else {
              database("directus_users")
                .where({
                  email: email,
                })
                .then(async (mail) => {
                  if (mail.length > 0) {
                    res.send("directus_user_exists");
                  } else {
                    const registration = await register.createOne({
                      first_name: firstName,
                      last_name: lastName,
                      email: email,
                      existed: false,
                      email_sent: false,
                      pin: generatedPin,
                      valid: time,
                    });
                    database("new_registration")
                      .where({
                        id: registration,
                        email_sent: false,
                      })
                      .then(async () => {
                        const mail = await mailer
                          .send({
                            to: email,
                            bcc: "",
                            subject: "Activation Pin",
                            template: {
                              name: "base",
                              data: {
                                pin: generatedPin,
                                projectName: "Hybrid Learning",
                              },
                            },
                          })
                          .then(async () => {
                            await register.updateOne(registration, {
                              email_sent: true,
                            });
                            if (registration) {
                              database("new_registration")
                                .where({
                                  id: registration,
                                })
                                .then((data) => {
                                  let obj = {
                                    data: data[0],
                                    status: "user_created",
                                  };
                                  res.send(obj);
                                });
                            }
                          });
                      })
                      .catch((err) => {
                        console.log(err);
                      });
                  }
                });
            }
          });
      } else {
        res.send("invalid email address");
      }
    });

    router.post("/pin", async (req, res) => {
      const { pin } = req.body;

      database("new_registration")
        .where({
          pin: pin,
        })
        .then((data) => {
          if (data.length > 0) {
            const index = data.findIndex((x) => x.pin === pin);
            let result = Date.now() - data[index].valid;
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

    router.post("/password", async (req, res) => {
      const { pin, password } = req.body;

      const register = new ItemsService("new_registration", {
        schema: req.schema,
      });

      const users = new UsersService({
        schema: req.schema,
        collection: "directus_users",
      });

      const teams = new ItemsService("teams", {
        schema: req.schema,
      });

      const pack = new ItemsService("packages", {
        schema: req.schema,
      });
      let email = null;
      let newUser;
      let team;
      let pac;
      let id;
      database("new_registration")
        .where({
          pin: pin,
        })
        .then(async (data) => {
          const index = data.findIndex((x) => x.pin === pin);
          email = data[index].email;
          id = data[index].id;
          if (index > -1) {
            newUser = await users.createOne({
              first_name: data[index].first_name,
              last_name: data[index].last_name,
              email: email,
              password: password,
              theme: "auto",
              status: "active",
              role: "6bbd5c06-ae83-4deb-9611-31a00feb4ce2",
              email_notifications: true,
            });

            await register.updateOne(data[index].id, {
              existed: true,
            });
          } else {
            res.send("something went wrong");
          }
        })
        .then(async () => {
          database("directus_users")
            .where({
              email: email,
            })
            .then(async (data2) => {
              const index2 = data2.findIndex((x) => x.email === email);
              let obj = {
                directus_users_id: data2[index2].id,
              };
              team = await teams.createOne({
                title: data2[index2].first_name + " team",
                package: 5,
                image: null,
                team_admin: data2[index2].id,
                teachers: [obj],
              });

              await users.updateOne(data2[index2].id, {
                team_id: team,
              });
              database("teams")
                .where({
                  title: data2[index2].first_name + " team",
                })
                .then(async (data5) => {
                  let index5 = data5.findIndex(
                    (x) => x.title === data2[index2].first_name + " team"
                  );
                  let p = await pack.readOne("5");

                  let subscription = p.team_id;
                  let obj1 = {
                    teams_id: data5[index5].id,
                  };
                  subscription.push(obj1);

                  pac = await pack.updateOne("5", {
                    team_id: subscription,
                  });
                  if (newUser && team && pac) {
                    database("directus_users")
                      .where({
                        id: newUser,
                      })
                      .then((data) => {
                        database("teams")
                          .where({
                            id: team,
                          })
                          .then((data2) => {
                            database("packages")
                              .where({
                                id: pac,
                              })
                              .then(async (data3) => {
                                let obj = {
                                  data: data[0],
                                  data2: data2[0],
                                  data3: data3[0],
                                  status: "user_successfully_created",
                                };
                                await register.deleteOne(id);
                                res.send(obj);
                              });
                          });
                      });
                  }
                });
            });
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

      const register = new ItemsService("new_registration", {
        schema: req.schema,
      });
      const mailer = new MailService({ schema: req.schema });

      database("new_registration")
        .where({
          email: email,
        })
        .then(async (data) => {
          let index = data.findIndex((x) => x.email === email);
          if (data[index].email_sent === true) {
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
                let c = await register.updateOne(data[index].id, {
                  pin: generatedPin,
                  valid: time,
                });
                if (c) {
                  database("new_registration")
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
          } else {
            res.send("something_went_wrong");
          }
        })
        .catch((err) => {
          console.log(err);
        });
    });

    router.post("/invitation", async (req, res) => {
      const acountability = req.accountability;

      if (
        !acountability.user &&
        acountability.role !== "6bbd5c06-ae83-4deb-9611-31a00feb4ce2"
      ) {
        res.send("you_do_not_have_access");
      } else {
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

        const mailer = new MailService({ schema: req.schema });

        const register = new ItemsService("invites", {
          schema: req.schema,
        });

        const team = new ItemsService("teams", {
          schema: req.schema,
        });

        const user = new ItemsService("directus_users", {
          schema: req.schema,
        });

        const team_d = new ItemsService("teams_directus_users", {
          schema: req.schema,
        });

        let time = Date.now();
        let team_id;
        let team_name;

        const generatedPin = generate();
        database("directus_users")
          .where({
            email: email,
          })
          .then(async (data) => {
            if (data.length > 0) {
              database("teams")
                .where({
                  team_admin: acountability.user,
                })
                .then(async (data3) => {
                  const index3 = data3.findIndex(
                    (x) => x.team_admin === acountability.user
                  );
                  team_name = data3[index3].title;
                  team_id = data3[index3].id;
                  let check = await team.readOne(data3[index3].id);
                  let u = check.teachers;
                  let team_users = await team_d.readMany(u).catch((err) => {
                    console.log(err);
                  });
                  let users = team_users.map((item) => item.directus_users_id);
                  let directus_users = await user
                    .readMany(users)
                    .catch((err) => {
                      console.log(err);
                    });

                  if (
                    directus_users.map((item) => item.email).includes(email)
                  ) {
                    let obj = {
                      email: email,
                      status: "user_already_in_team",
                    };
                    return res.send(obj);
                    // resData.push(obj);
                  } else {
                    const e_mail = await mailer
                      .send({
                        to: email,
                        bcc: "",
                        subject: "Invitation",
                        template: {
                          name: "invitation2",
                          data: {
                            url:
                              "http://localhost:9200/login?ap=" + generatedPin,
                            projectName: "Hybrid Learning",
                            pin: generatedPin,
                            user: team_name,
                          },
                        },
                      })
                      .then(async () => {
                        database("invites")
                          .where({
                            email: email,
                          })
                          .then(async (data) => {
                            let index = data.findIndex(
                              (x) => x.email === email
                            );
                            if (data.length > 0) {
                              let created = data[index].user_created;
                              if (acountability.user !== created) {
                                const registration = await register
                                  .createOne({
                                    user_created: acountability.user,
                                    email: email,
                                    pin: generatedPin,
                                    valid: time,
                                    exist: true,
                                    team_id: team_id,
                                    email_sent: true,
                                  })
                                  .catch((err) => {
                                    console.log(err);
                                  });

                                if (registration) {
                                  database("invites")
                                    .where({
                                      id: registration,
                                    })
                                    .then((data) => {
                                      let obj = {
                                        email: email,
                                        data: data[0],
                                        status: "invitation_sent",
                                      };
                                      res.send(obj);
                                      // resData.push(obj);
                                    })
                                    .catch((err) => {
                                      console.log(err);
                                    });
                                }
                              } else {
                                const registration = await register
                                  .updateOne(data[index].id, {
                                    pin: generatedPin,
                                  })
                                  .catch((err) => {
                                    console.log(err);
                                  });

                                if (registration) {
                                  database("invites")
                                    .where({
                                      id: registration,
                                    })
                                    .then((data) => {
                                      let obj = {
                                        email: email,
                                        data: data[0],
                                        status: "invitation_sent",
                                      };
                                      res.send(obj);
                                      // resData.push(obj);
                                    })
                                    .catch((err) => {
                                      console.log(err);
                                    });
                                }
                              }
                            } else {
                              const registration = await register
                                .createOne({
                                  user_created: acountability.user,
                                  email: email,
                                  pin: generatedPin,
                                  valid: time,
                                  exist: true,
                                  team_id: team_id,
                                  email_sent: true,
                                })
                                .catch((err) => {
                                  console.log(err);
                                });

                              if (registration) {
                                database("invites")
                                  .where({
                                    id: registration,
                                  })
                                  .then((data) => {
                                    let obj = {
                                      email: email,
                                      data: data[0],
                                      status: "invitation_sent",
                                    };
                                    res.send(obj);
                                    // resData.push(obj);
                                  })
                                  .catch((err) => {
                                    console.log(err);
                                  });
                              }
                            }
                          })
                          .catch((err) => {
                            console.log(err);
                          });
                      })
                      .catch((err) => {
                        console.log(err);
                      });
                  }
                });
            } else {
              database("teams")
                .where({
                  team_admin: acountability.user,
                })
                .then(async (data3) => {
                  const index3 = data3.findIndex(
                    (x) => x.team_admin === acountability.user
                  );
                  team_name = data3[index3].title;
                  team_id = data3[index3].id;
                  const e_mail = await mailer
                    .send({
                      to: email,
                      bcc: "",
                      subject: "Invitation",
                      template: {
                        name: "invitation",
                        data: {
                          url: "http://localhost:9200/registerinvite",
                          projectName: "Hybrid Learning",
                          pin: generatedPin,
                          user: team_name,
                        },
                      },
                    })
                    .then(async () => {
                      database("invites")
                        .where({
                          email: email,
                        })
                        .then(async (data) => {
                          let index = data.findIndex((x) => x.email === email);
                          if (data.length > 0) {
                            let created = data[index].user_created;
                            if (acountability.user !== created) {
                              const registration = await register
                                .createOne({
                                  user_created: acountability.user,
                                  email: email,
                                  pin: generatedPin,
                                  valid: time,
                                  exist: true,
                                  team_id: team_id,
                                  email_sent: true,
                                })
                                .catch((err) => {
                                  console.log(err);
                                });

                              if (registration) {
                                database("invites")
                                  .where({
                                    id: registration,
                                  })
                                  .then((data) => {
                                    let obj = {
                                      email: email,
                                      data: data[0],
                                      status: "invitation_sent",
                                    };
                                    res.send(obj);
                                    // resData.push(obj);
                                  })
                                  .catch((err) => {
                                    console.log(err);
                                  });
                              }
                            } else {
                              const registration = await register
                                .updateOne(data[index].id, {
                                  pin: generatedPin,
                                })
                                .catch((err) => {
                                  console.log(err);
                                });

                              if (registration) {
                                database("invites")
                                  .where({
                                    id: registration,
                                  })
                                  .then((data) => {
                                    let obj = {
                                      email: email,
                                      data: data[0],
                                      status: "invitation_sent",
                                    };
                                    res.send(obj);
                                    // resData.push(obj);
                                  })
                                  .catch((err) => {
                                    console.log(err);
                                  });
                              }
                            }
                          } else {
                            const registration = await register
                              .createOne({
                                user_created: acountability.user,
                                email: email,
                                pin: generatedPin,
                                valid: time,
                                exist: false,
                                team_id: team_id,
                                email_sent: true,
                              })
                              .catch((err) => {
                                console.log(err);
                              });

                            if (registration) {
                              database("invites")
                                .where({
                                  id: registration,
                                })
                                .then((data) => {
                                  let obj = {
                                    email: email,
                                    data: data[0],
                                    status: "invitation_sent",
                                  };
                                  res.send(obj);
                                  // resData.push(obj);
                                })
                                .catch((err) => {
                                  console.log(err);
                                });
                            }
                          }
                        });
                    });
                });
            }
          });
      }
    });

    router.post("/validation", async (req, res) => {
      const { pin } = req.body;

      database("invites")
        .where({
          pin: pin,
        })
        .then(async (data) => {
          if (data.length > 0) {
            const index = data.findIndex((x) => x.pin === pin);

            database("directus_users")
              .where({
                email: data[index].email,
              })
              .then((data2) => {
                if (data2.length > 0) {
                  res.send("user_exist");
                } else {
                  res.send("user_dont_exist");
                }
              });
          } else {
            res.send("wrong_pin");
          }
        })
        .catch((err) => {
          console.log(err);
        });
    });

    router.post("/teacher", async (req, res) => {
      const { first_name, last_name, pin } = req.body;

      const register = new ItemsService("invites", {
        schema: req.schema,
      });

      database("invites")
        .where({
          pin: pin,
        })
        .then(async (data) => {
          const index = data.findIndex((x) => x.pin === pin);
          if (index > -1) {
            let c = await register.updateOne(data[index].id, {
              first_name: first_name,
              last_name: last_name,
            });
            if (c) {
              database("invites")
                .where({
                  id: c,
                })
                .then((data) => {
                  let obj = {
                    data: data[0],
                    status: "user_updated",
                  };
                  res.send(obj);
                });
            }
          } else {
            res.send("something_went_wrong");
          }
        })
        .catch((err) => {
          console.log(err);
        });
    });

    router.post("/create_user", async (req, res) => {
      const { pin, password } = req.body;

      const users = new UsersService({
        schema: req.schema,
        collection: "directus_users",
      });

      const teams = new ItemsService("teams", {
        schema: req.schema,
      });

      database("invites")
        .where({
          pin: pin,
        })
        .then(async (data) => {
          const index = data.findIndex((x) => x.pin === pin);
          if (index > -1) {
            let newUser = await users.createOne({
              first_name: data[index].first_name,
              last_name: data[index].last_name,
              email: data[index].email,
              password: password,
              theme: "auto",
              status: "active",
              role: "6bbd5c06-ae83-4deb-9611-31a00feb4ce2",
              email_notifications: true,
            });

            if (newUser) {
              database("directus_users")
                .where({
                  id: newUser,
                })
                .then(async (data) => {
                  const index = data.findIndex((x) => x.id === newUser);

                  let obj1 = {
                    directus_users_id: data[index].id,
                  };

                  let team = await teams.createOne({
                    title: data[index].first_name + " team",
                    package: 5,
                    image: null,
                    team_admin: data[index].id,
                    teachers: [obj1],
                  });

                  await users.updateOne(data[index].id, {
                    team_id: team,
                  });

                  let obj = {
                    data: data[0],
                    status: "teacher_successfully_invited",
                  };
                  res.send(obj);
                });
            }
          } else {
            res.send("something_went_wrong");
          }
        })
        .catch((err) => {
          console.log(err);
        });
    });

    router.post("/team_invite", async (req, res) => {
      const { pin } = req.body;

      const teams = new ItemsService("teams", {
        schema: req.schema,
      });

      const team_d = new ItemsService("teams_directus_users", {
        schema: req.schema,
      });

      const pack = new ItemsService("packages", {
        schema: req.schema,
      });

      const invite = new ItemsService("invites", {
        schema: req.schema,
      });

      const users = new UsersService({
        schema: req.schema,
        collection: "directus_users",
      });

      database("invites")
        .where({
          pin: pin,
        })
        .then((mail) => {
          const random = mail.findIndex((x) => x.pin === pin);
          database("directus_users")
            .where({
              email: mail[random].email,
            })
            .then(async (data) => {
              const index = data.findIndex(
                (x) => x.email === mail[random].email
              );
              const user = data[index].id;
              if (index > -1) {
                database("teams")
                  .where({
                    team_admin: mail[random].user_created,
                    id: mail[random].team_id,
                  })
                  .then(async (data3) => {
                    const index3 = data3.findIndex(
                      (x) => x.team_admin === mail[random].user_created
                    );
                    let id = data3[index3].id;

                    const teacher = await teams.readOne(id);
                    let teachers = teacher.teachers;
                    let obj = {
                      directus_users_id: user,
                    };
                    let allteachers = await team_d.readMany(teachers);
                    if (
                      allteachers
                        .map((item) => item.directus_users_id)
                        .includes(user)
                    ) {
                      res.send("user_already_in_team");
                    } else {
                      teachers.push(obj);

                      let c = await teams.updateOne(data3[index3].id, {
                        teachers: teachers,
                      });

                      database("teams")
                        .where({
                          title: data3[index3].title,
                        })
                        .then(async (data5) => {
                          let index5 = data5.findIndex(
                            (x) => x.title === data3[index3].title
                          );

                          let p = await pack.readOne(
                            Number(data5[index5].package)
                          );

                          let subscription = p.team_id;
                          let obj1 = {
                            teams_id: data5[index5].id,
                          };
                          subscription.push(obj1);

                          let b = await pack.updateOne(data5[index5].package, {
                            team_id: subscription,
                          });
                          let i = await invite.updateOne(mail[random].id, {
                            completed: true,
                          });

                          if (c) {
                            console.log(c, "mphka");
                            database("teams")
                              .where({
                                id: c,
                              })
                              .then((data) => {
                                database("packages")
                                  .where({
                                    id: b,
                                  })
                                  .then((data2) => {
                                    database("invites")
                                      .where({
                                        id: i,
                                      })
                                      .then((data3) => {
                                        console.log | "send";
                                        let obj = {
                                          data: data[0],
                                          data2: data2[0],
                                          data3: data3[0],
                                          status: "teams_created",
                                        };
                                        res.send(obj);
                                      });
                                  });
                              });
                          }
                        });
                    }
                  });
              } else {
                res.send("you_do_not_have_access");
              }
            });
        })
        .catch((err) => {
          console.log(err);
        });
    });
  },
};
