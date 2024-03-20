import axios from "axios";
import {
  AccessToken,
  RoomServiceClient,
  EgressClient,
  EncodedFileType,
} from "livekit-server-sdk";
import { VideoPresets, Room, DataPacket_Kind } from "livekit-client";
import * as minio from 'minio'
// import { FFmpeg } from '@ffmpeg/ffmpeg';
export default {
  id: "data",
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

    router.post("/course_create", async (req, res) => {
      const acountability = req.accountability;

      if (
        !acountability.user &&
        acountability.role !== "6bbd5c06-ae83-4deb-9611-31a00feb4ce2"
      ) {
        res.send("you_do_not_have_access");
      } else {
        const {
          title,
          description,
          short_description,
          image,
          tags,
          details,
          team_id,
        } = req.body;

        database("teams_directus_users")
          .where({
            teams_id: team_id,
            directus_users_id: acountability.user,
          })
          .then((data) => {
            if (data.length <= 0) {
              return res.send("wrong_team");
            }
          })
          .catch((err) => {
            console.log(err);
          });

        const course = new ItemsService("courses", {
          schema: req.schema,
        });

        let c = await course
          .createOne({
            title: title,
            short_description: short_description,
            description: description,
            details: details,
            image: image,
            tags: tags,
            published: true,
            team_id: team_id,
            owner: acountability.user,
          })
          .catch((err) => {
            console.log(err);
          });

        if (c) {
          database("courses")
            .where({
              id: c,
            })
            .then((data) => {
              let obj = {
                event: 'create_course',
                data: data[0],
                key: 'lkadhjauidfghui2387208sakjldnkalsj872nkmj29'
              }
              axios.post('https://socket.sw.hybrid-class.gr/onupdate', obj).then((data) => {
                console.log(data)
              })
              res.send(data[0]);
            }).catch((err) => {
              console.log(err);
            });
        }
      }
    });

    router.post("/course_update", async (req, res) => {
      const acountability = req.accountability;

      if (
        !acountability.user &&
        acountability.role !== "6bbd5c06-ae83-4deb-9611-31a00feb4ce2"
      ) {
        res.send("you_do_not_have_access");
      } else {
        const {
          title,
          description,
          short_description,
          image,
          tags,
          details,
          team_id,
          course_id,
        } = req.body;

        database("teams_directus_users")
          .where({
            teams_id: team_id,
            directus_users_id: acountability.user,
          })
          .then((data) => {
            if (data.length <= 0) {
              return res.send("wrong_team");
            }
          })
          .catch((err) => {
            console.log(err);
          });

        const course = new ItemsService("courses", {
          schema: req.schema,
        });

        let info = await course.readOne(course_id)
        let version = info.version
        version++

        let c = await course
          .updateOne(course_id, {
            title: title,
            short_description: short_description,
            description: description,
            details: details,
            image: image,
            tags: tags,
            published: true,
            version: version
          })
          .catch((err) => {
            console.log(err);
          });

        if (c) {
          database("courses")
            .where({
              id: c,
            })
            .then((data) => {
              let obj = {
                event: 'update_course',
                data: data[0],
                key: 'lkadhjauidfghui2387208sakjldnkalsj872nkmj29'
              }
              axios.post('https://socket.sw.hybrid-class.gr/onupdate', obj).then((data) => {
                console.log(data)
              })
              res.send(data[0]);
            }).catch((err) => {
              console.log(err);
            });
        }
      }
    });

    router.post("/session", async (req, res) => {
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
          var charactersLength = 5;
          for (var i = 0; i < charactersLength; i++) {
            result += characters.charAt(
              Math.floor(Math.random() * characters.length)
            );
          }
          database("sessions")
            .then((data) => {
              const index = data.findIndex((x) => x.pin === result);
              if (index > -1) {
                generate();
              }
            })
            .catch((err) => {
              console.log(err);
            });
          return result;
        }

        const {
          session_name,
          schedule_at,
          description,
          details,
          participants,
          lesson_id,
          team_id,
        } = req.body;

        database("teams_directus_users")
          .where({
            teams_id: team_id,
            directus_users_id: acountability.user,
          })
          .then((data) => {
            if (data.length <= 0) {
              return res.send("wrong_team");
            }
          })
          .catch((err) => {
            console.log(err);
          });

        let generatedPin = generate();

        const session = new ItemsService("sessions", {
          schema: req.schema,
        });

        const ses = await session
          .createOne({
            session_name: session_name,
            schedule_at: schedule_at,
            description: description,
            details: details,
            participants: participants,
            lesson_id: lesson_id,
            team_id: team_id,
            pin: generatedPin,
            finished: false,
            owner: acountability.user,
          })
          .catch((err) => {
            console.log(err);
          });

        if (ses) {
          database("sessions")
            .where({
              id: ses,
            })
            .then((data) => {
              let obj = {
                event: 'create_session',
                data: data[0],
                key: 'lkadhjauidfghui2387208sakjldnkalsj872nkmj29'
              }
              axios.post('https://socket.sw.hybrid-class.gr/onupdate', obj).then((data) => {
                console.log(data)
              })
              res.send(data[0]);
            }).catch((err) => {
              console.log(err);
            });
        }
      }
    });

    router.post("/session_update", async (req, res) => {
      const acountability = req.accountability;
      if (
        !acountability.user &&
        acountability.role !== "6bbd5c06-ae83-4deb-9611-31a00feb4ce2"
      ) {
        res.send("you_do_not_have_access");
      } else {
        const {
          session_name,
          schedule_at,
          description,
          details,
          team_id,
          session_id,
        } = req.body;

        database("teams_directus_users")
          .where({
            teams_id: team_id,
            directus_users_id: acountability.user,
          })
          .then((data) => {
            if (data.length <= 0) {
              return res.send("wrong_team");
            }
          })
          .catch((err) => {
            console.log(err);
          });

        const session = new ItemsService("sessions", {
          schema: req.schema,
        });

        let info = await session.readOne(session_id)
        let version = info.version
        version++

        const ses = await session
          .updateOne(session_id, {
            session_name: session_name,
            schedule_at: schedule_at,
            description: description,
            details: details,
            version: version
          })
          .catch((err) => {
            console.log(err);
          });

        if (ses) {
          database("sessions")
            .where({
              id: ses,
            })
            .then((data) => {
              let obj = {
                event: 'update_session',
                data: data[0],
                key: 'lkadhjauidfghui2387208sakjldnkalsj872nkmj29'
              }
              axios.post('https://socket.sw.hybrid-class.gr/onupdate', obj).then((data) => {
                console.log(data)
              })
              res.send(data[0]);
            }).catch((err) => {
              console.log(err);
            });
        }
      }
    });

    router.post("/lesson", async (req, res) => {
      const acountability = req.accountability;
      if (
        !acountability.user &&
        acountability.role !== "6bbd5c06-ae83-4deb-9611-31a00feb4ce2"
      ) {
        res.send("you_do_not_have_access");
      } else {
        const {
          title,
          description,
          short_description,
          details,
          courses_id,
          team_id,
        } = req.body;

        database("teams_directus_users")
          .where({
            teams_id: team_id,
            directus_users_id: acountability.user,
          })
          .then((data) => {
            if (data.length <= 0) {
              return res.send("wrong_team");
            }
          })
          .catch((err) => {
            console.log(err);
          });

        const lesson = new ItemsService("lessons", {
          schema: req.schema,
        });

        const les = await lesson
          .createOne({
            title: title,
            short_description: short_description,
            description: description,
            details: details,
            courses_id: courses_id,
            team_id: team_id,
            published: true,
            owner: acountability.user,
          })
          .catch((err) => {
            console.log(err);
          });

        if (les) {
          database("lessons")
            .where({
              id: les,
            })
            .then((data) => {
              let obj = {
                event: 'create_lesson',
                data: data[0],
                key: 'lkadhjauidfghui2387208sakjldnkalsj872nkmj29'
              }
              axios.post('https://socket.sw.hybrid-class.gr/onupdate', obj).then((data) => {
                console.log(data)
              })
              res.send(data[0]);
            }).catch((err) => {
              console.log(err);
            });
        }
      }
    });

    router.post("/lesson_update", async (req, res) => {
      const acountability = req.accountability;
      if (
        !acountability.user &&
        acountability.role !== "6bbd5c06-ae83-4deb-9611-31a00feb4ce2"
      ) {
        res.send("you_do_not_have_access");
      } else {
        const {
          title,
          description,
          short_description,
          details,
          team_id,
          lesson_id,
        } = req.body;

        database("teams_directus_users")
          .where({
            teams_id: team_id,
            directus_users_id: acountability.user,
          })
          .then((data) => {
            if (data.length <= 0) {
              return res.send("wrong_team");
            }
          })
          .catch((err) => {
            console.log(err);
          });

        const lesson = new ItemsService("lessons", {
          schema: req.schema,
        });

        let info = await lesson.readOne(lesson_id)
        let version = info.version
        version++

        const les = await lesson
          .updateOne(lesson_id, {
            title: title,
            short_description: short_description,
            description: description,
            details: details,
            version: version
          })
          .catch((err) => {
            console.log(err);
          });

        if (les) {
          database("lessons")
            .where({
              id: les,
            })
            .then((data) => {
              let obj = {
                event: 'update_lesson',
                data: data[0],
                key: 'lkadhjauidfghui2387208sakjldnkalsj872nkmj29'
              }
              axios.post('https://socket.sw.hybrid-class.gr/onupdate', obj).then((data) => {
                console.log(data)
              })
              res.send(data[0]);
            }).catch((err) => {
              console.log(err);
            });
        }
      }
    });

    router.post("/tags_create", async (req, res) => {
      const acountability = req.accountability;

      if (
        !acountability.user &&
        acountability.role !== "6bbd5c06-ae83-4deb-9611-31a00feb4ce2"
      ) {
        res.send("you_do_not_have_access");
      } else {
        const { title, team_id } = req.body;

        database("teams_directus_users")
          .where({
            teams_id: team_id,
            directus_users_id: acountability.user,
          })
          .then((data) => {
            if (data.length <= 0) {
              return res.send("wrong_team");
            }
          })
          .catch((err) => {
            console.log(err);
          });

        const tag = new ItemsService("tags", {
          schema: req.schema,
        });

        let c = await tag
          .createOne({
            title: title,
            team_id: team_id,
          })
          .catch((err) => {
            console.log(err);
          });

        if (c) {
          database("tags")
            .where({
              id: c,
            })
            .then((data) => {
              res.send(data[0]);
            });
        }
      }
    });

    router.post("/tags_delete", async (req, res) => {
      const acountability = req.accountability;

      if (
        !acountability.user &&
        acountability.role !== "6bbd5c06-ae83-4deb-9611-31a00feb4ce2"
      ) {
        res.send("you_do_not_have_access");
      } else {
        const { id, team_id } = req.body;

        database("teams_directus_users")
          .where({
            teams_id: team_id,
            directus_users_id: acountability.user,
          })
          .then((data) => {
            if (data.length <= 0) {
              return res.send("wrong_team");
            }
          })
          .catch((err) => {
            console.log(err);
          });

        const tag = new ItemsService("tags", {
          schema: req.schema,
        });

        await tag.deleteOne(id).catch((err) => {
          console.log(err);
        });

        let obj = {
          status: "deleted " + id,
        };

        res.send(obj);
      }
    });

    router.post("/tags_update", async (req, res) => {
      const acountability = req.accountability;

      if (
        !acountability.user &&
        acountability.role !== "6bbd5c06-ae83-4deb-9611-31a00feb4ce2"
      ) {
        res.send("you_do_not_have_access");
      } else {
        const { tag_id, team_id, title } = req.body;

        database("teams_directus_users")
          .where({
            teams_id: team_id,
            directus_users_id: acountability.user,
          })
          .then((data) => {
            if (data.length <= 0) {
              return res.send("wrong_team");
            }
          })
          .catch((err) => {
            console.log(err);
          });

        const tag = new ItemsService("tags", {
          schema: req.schema,
        });

        let c = await tag
          .updateOne(tag_id, {
            title: title,
          })
          .catch((err) => {
            console.log(err);
          });

        if (c) {
          database("tags")
            .where({
              id: c,
            })
            .then((data) => {
              res.send(data[0]);
            });
        }
      }
    });

    router.post("/team_update", async (req, res) => {
      const acountability = req.accountability;

      if (
        !acountability.user &&
        acountability.role !== "6bbd5c06-ae83-4deb-9611-31a00feb4ce2"
      ) {
        res.send("you_do_not_have_access");
      } else {
        const { team_id, title, description, image } = req.body;

        database("teams_directus_users")
          .where({
            teams_id: team_id,
            directus_users_id: acountability.user,
          })
          .then((data) => {
            if (data.length <= 0) {
              return res.send("wrong_team");
            }
          })
          .catch((err) => {
            console.log(err);
          });

        const team = new ItemsService("teams", {
          schema: req.schema,
        });

        let c = await team
          .updateOne(team_id, {
            title: title,
            description: description,
            image: image,
          })
          .catch((err) => {
            console.log(err);
          });

        if (c) {
          database("teams")
            .where({
              id: c,
            })
            .then((data) => {
              let obj1 = {
                team_id: team_id,
                data: data[0]
              }
              let obj = {
                event: 'team_update',
                data: obj1,
                key: 'lkadhjauidfghui2387208sakjldnkalsj872nkmj29'
              }
              axios.post('https://socket.sw.hybrid-class.gr/onupdate', obj).then((data) => {
                console.log(data)
              })
              res.send(data[0]);
            }).catch((err) => {
              console.log(err);
            });
        }
      }
    });
    //oven
    // router.post("/token", async (req, res) => {
    //   const { sesID } = req.body;
    //   const acountability = req.accountability;
    //   if (
    //     !acountability.user &&
    //     acountability.role !== "6bbd5c06-ae83-4deb-9611-31a00feb4ce2"
    //   ) {
    //     res.send("you_do_not_have_access");
    //   } else {
    //     function generate() {
    //       var result = "";
    //       var characters =
    //         "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";
    //       var charactersLength = 32;
    //       for (var i = 0; i < charactersLength; i++) {
    //         result += characters.charAt(
    //           Math.floor(Math.random() * characters.length)
    //         );
    //       }
    //       return result;
    //     }

    //     function generate1() {
    //       var result = "";
    //       var characters =
    //         "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";
    //       var charactersLength = 6;
    //       for (var i = 0; i < charactersLength; i++) {
    //         result += characters.charAt(
    //           Math.floor(Math.random() * characters.length)
    //         );
    //       }
    //       return result;
    //     }

    //     let unique = generate1();

    //     const tok = new ItemsService("tokens", {
    //       schema: req.schema,
    //     });

    //     const team = new ItemsService("teams", {
    //       schema: req.schema,
    //     });

    //     const team_d = new ItemsService("teams_directus_users", {
    //       schema: req.schema,
    //     });

    //     const pack = new ItemsService("packages", {
    //       schema: req.schema,
    //     });

    //     const user = new ItemsService("directus_users", {
    //       schema: req.schema,
    //     });

    //     let me = await user.readOne(acountability.user).catch((err) => {
    //       console.log(err);
    //     });

    //     const t = me.team_id;

    //     let info = await team.readOne(t).catch((err) => {
    //       console.log(err);
    //     });
    //     let teachers = info.teachers;
    //     let p = await pack.readOne(info.package).catch((err) => {
    //       console.log(err);
    //     });
    //     let token = generate();
    //     let users = await team_d.readMany(teachers).catch((err) => {
    //       console.log(err);
    //     });

    //     if (
    //       !users
    //         .map((item) => item.directus_users_id)
    //         .includes(acountability.user)
    //     ) {
    //       return res.send("wrong team");
    //     }

    //     if (p.replay === true) {
    //       const licence = await tok.createOne({
    //         token: token,
    //       });

    //       axios.post(
    //         "http://192.168.1.115:8081/v1/vhosts/default/apps/app:startRecord?skip=true",
    //         {
    //           id: unique,
    //           stream: {
    //             name: "session_" + sesID,
    //             variantNames: [],
    //           },
    //         },
    //         {
    //           headers: {
    //             Authorization: `Basic MTIzNA==`,
    //           },
    //         }
    //       );

    //       let obj = {
    //         tid: licence,
    //         token: token,
    //       };

    //       res.send(obj);
    //     } else {
    //       const licence = await tok.createOne({
    //         token: token,
    //       });

    //       let obj = {
    //         tid: licence,
    //         token: token,
    //       };

    //       res.send(obj);
    //     }
    //   }
    // });

    // router.post("/streaming", async (req, res) => {
    //   const tok = new ItemsService("tokens", {
    //     schema: req.schema,
    //   });

    //   const paramsString = req.body.request.url;
    //   let searchParams = new URL(paramsString).searchParams;
    //   console.log("url : ", searchParams);

    //   if (searchParams.has("session")) {
    //     let token = searchParams.get("token");
    //     let id = searchParams.get("session");
    //     let tid = searchParams.get("tid");
    //     let auth = await tok.readOne(tid).catch((err) => {
    //       console.log(err);
    //     });
    //     if (auth.token === token && token !== undefined) {
    //       database("sessions")
    //         .where({
    //           id: id,
    //           finished: false,
    //         })
    //         .then(async (data) => {
    //           if (data.length > -1) {
    //             res.send({
    //               allowed: true,
    //             });
    //             // await tok.deleteOne(tid);
    //           } else {
    //             res.send({
    //               allowed: false,
    //             });
    //             // await tok.deleteOne(tid);
    //           }
    //         });
    //     } else {
    //       res.send({
    //         allowed: false,
    //       });
    //     }
    //   } else if (searchParams.has("skip")) {
    //     console.log("skip");
    //     res.send({
    //       allowed: true,
    //     });
    //   } else {
    //     console.log("denied");
    //     res.send({
    //       allowed: false,
    //     });
    //   }
    // });

    router.post("/delete_course", async (req, res) => {
      const acountability = req.accountability;
      if (
        !acountability.user &&
        acountability.role !== "6bbd5c06-ae83-4deb-9611-31a00feb4ce2"
      ) {
        res.send("you_do_not_have_access");
      } else {
        const { id } = req.body;

        const course = new ItemsService("courses", {
          schema: req.schema,
        });

        const lesson = new ItemsService("lessons", {
          schema: req.schema,
        });

        const session = new ItemsService("sessions", {
          schema: req.schema,
        });

        let info = await course.readOne(id).catch((err) => {
          console.log(err);
        });
        let team_id = info.team_id

        let lid;
        let sid;

        let obj = {
          team_id: team_id,
          course: {
            id: id,
            published: false,
          },
          lesson: {
            id: lid,
            published: false,
          },
          session: {
            id: sid,
            published: false,
          },
        };

        let hide = await course
          .updateOne(id, {
            published: false,
          })
          .then(async () => {
            database("lessons")
              .where({
                courses_id: id,
              })
              .then(async (data) => {
                if (data.length > 0) {
                  lid = data.map((item) => item.id);
                  if (lid) {
                    await lesson.updateMany(lid, {
                      published: false,
                    });
                  }
                }
              })
              .then(() => {
                if (lid) {
                  lid.forEach((element) => {
                    database("sessions")
                      .where({
                        lesson_id: element,
                      })
                      .then(async (data2) => {
                        if (data2.length > 0) {
                          sid = data2.map((item) => item.id);
                          await session.updateMany(sid, {
                            published: false,
                          });
                        }
                      });
                  });
                }
              });
          })
          .catch((err) => {
            console.log(err);
          });

        let obj1 = {
          event: 'course_to_trash',
          data: obj,
          key: 'lkadhjauidfghui2387208sakjldnkalsj872nkmj29'
        }
        axios.post('https://socket.sw.hybrid-class.gr/onupdate', obj1).then((data) => {
          console.log(data)
        }).catch((err) => {
          console.log(err);
        });

        res.send(obj);
      }
    });

    router.post("/restore_course", async (req, res) => {
      const acountability = req.accountability;
      if (
        !acountability.user &&
        acountability.role !== "6bbd5c06-ae83-4deb-9611-31a00feb4ce2"
      ) {
        res.send("you_do_not_have_access");
      } else {
        const { id } = req.body;

        const course = new ItemsService("courses", {
          schema: req.schema,
        });

        const lesson = new ItemsService("lessons", {
          schema: req.schema,
        });

        const session = new ItemsService("sessions", {
          schema: req.schema,
        });

        let info = await course.readOne(id).catch((err) => {
          console.log(err);
        });
        let team_id = info.team_id

        let lid;
        let sid;

        let obj = {
          team_id: team_id,
          course: {
            id: id,
            published: true,
          },
          lesson: {
            id: lid,
            published: true,
          },
          session: {
            id: sid,
            published: true,
          },
        };

        let hide = await course
          .updateOne(id, {
            published: true,
          })
          .then(async () => {
            database("lessons")
              .where({
                courses_id: id,
              })
              .then(async (data) => {
                if (data.length > 0) {
                  lid = data.map((item) => item.id);
                  await lesson.updateMany(lid, {
                    published: true,
                  });
                }
              })
              .then(() => {
                if (lid) {
                  lid.forEach((element) => {
                    database("sessions")
                      .where({
                        lesson_id: element,
                      })
                      .then(async (data2) => {
                        if (data2.length > 0) {
                          sid = data2.map((item) => item.id);
                          await session.updateMany(sid, {
                            published: true,
                          });
                        }
                      });
                  });
                }
              });
          })
          .catch((err) => {
            console.log(err);
          });

        let obj1 = {
          event: 'restore_course',
          data: obj,
          key: 'lkadhjauidfghui2387208sakjldnkalsj872nkmj29'
        }
        axios.post('https://socket.sw.hybrid-class.gr/onupdate', obj1).then((data) => {
          console.log(data)
        }).catch((err) => {
          console.log(err);
        });
        res.send(obj);
      }
    });

    router.post("/pdelete_course", async (req, res) => {
      const acountability = req.accountability;
      if (
        !acountability.user &&
        acountability.role !== "6bbd5c06-ae83-4deb-9611-31a00feb4ce2"
      ) {
        res.send("you_do_not_have_access");
      } else {
        const { id } = req.body;

        const course = new ItemsService("courses", {
          schema: req.schema,
        });

        const lesson = new ItemsService("lessons", {
          schema: req.schema,
        });

        const session = new ItemsService("sessions", {
          schema: req.schema,
        });

        const interactions = new ItemsService("session_interactions", {
          schema: req.schema,
        });

        let info = await course.readOne(id).catch((err) => {
          console.log(err);
        });
        let team_id = info.team_id

        let lid = [];
        let sid = [];
        let intid = [];

        let obj = {
          team_id: team_id,
          course: {
            deleted: id,
          },
          lesson: {
            deleted: lid,
          },
          session: {
            deleted: sid,
          },
        };
        let myPromise = new Promise((resolve, reject) => {
          database("lessons")
            .where({
              courses_id: id,
            })
            .then(async (data) => {
              lid = data.map((item) => item.id);
              if (lid) {
                console.log(lid, 'first lid')
                lid.forEach(async (element) => {
                  database("sessions")
                    .where({
                      lesson_id: element,
                    })
                    .then(async (data2) => {
                      sid = data2.map((item) => item.id);
                      if (sid) {
                        let p = await session.readMany(sid).catch(err => {
                          console.log(err)
                        })
                        console.log('sessions', p)
                        p.forEach(element => {
                          let pin = element.pin
                          const s3Client = new minio.Client({
                            endPoint: 's3.sw.hybrid-class.gr',
                            accessKey: 'FAI7XfSrm6M1sifpz0gH',
                            secretKey: 'u3b3bW25O69jS9YMeUQSufXOvwiOc1xgZP8mmH5v',
                          })

                          let objectsList = []
                          let bucket = 'livekit'
                          let prefix = pin
                          let recursive = true

                          let objectsStream = s3Client.listObjects(bucket, prefix, recursive)
                          objectsStream.on('data', function (obj1) {
                            objectsList.push(obj1)
                          })
                          objectsStream.on('error', function (e) {
                            return console.log('Unable to remove the objects', e)
                          })
                          objectsStream.on('end', function () {
                            s3Client.removeObjects(bucket, objectsList, function (e) {
                              if (e) {
                                return console.log('Unable to remove the objects', e)
                              }
                              console.log('Removed the objects')
                            })
                          })
                        });
                        sid.forEach(element2 => {
                          database("session_interactions").where({
                            session_id: element2
                          }).then(async (data3) => {
                            intid = data3.map((item) => item.id);
                            if (intid) {
                              await interactions.deleteMany(intid).catch((err) => {
                                console.log(err);
                              });
                            }
                          })
                        })
                        await session.deleteMany(sid).catch(err => {
                          console.log(err)
                        })
                        resolve(true)
                      }
                    });
                });
              }
            })
            .catch((err) => {
              console.log(err);
            });
        })

        await myPromise.then(async (resolve) => {
          console.log(lid, 'lid')
          await lesson.deleteMany(lid).catch(err => {
            console.log(err)
          })

          await course.deleteOne(id).catch(err => {
            console.log(err)
          })

          let obj1 = {
            event: 'delete_course',
            data: obj,
            key: 'lkadhjauidfghui2387208sakjldnkalsj872nkmj29'
          }
          axios.post('https://socket.sw.hybrid-class.gr/onupdate', obj1).then((data) => {
            console.log(data.data)
          }).catch((err) => {
            console.log(err);
          });

          res.send(obj);
        })
      }
    });

    router.post("/delete_lesson", async (req, res) => {
      const acountability = req.accountability;
      if (
        !acountability.user &&
        acountability.role !== "6bbd5c06-ae83-4deb-9611-31a00feb4ce2"
      ) {
        res.send("you_do_not_have_access");
      } else {
        const { id } = req.body;

        const lesson = new ItemsService("lessons", {
          schema: req.schema,
        });

        const session = new ItemsService("sessions", {
          schema: req.schema,
        });

        let info = await lesson.readOne(id).catch((err) => {
          console.log(err);
        });
        let team_id = info.team_id

        let sid;

        let obj = {
          team_id: team_id,
          lesson: {
            id: id,
            published: false,
          },
          session: {
            id: sid,
            published: false,
          },
        };

        let hide = await lesson
          .updateOne(id, {
            published: false,
          })
          .then(() => {
            database("sessions")
              .where({
                lesson_id: id,
              })
              .then(async (data) => {
                sid = data.map((item) => item.id);
                if (sid) {
                  await session.updateMany(sid, {
                    published: false,
                  });
                }
              });
          })
          .catch((err) => {
            console.log(err);
          });

        let obj1 = {
          event: 'lesson_to_trash',
          data: obj,
          key: 'lkadhjauidfghui2387208sakjldnkalsj872nkmj29'
        }
        axios.post('https://socket.sw.hybrid-class.gr/onupdate', obj1).then((data) => {
          console.log(data)
        }).catch((err) => {
          console.log(err);
        });

        res.send(obj);
      }
    });

    router.post("/restore_lesson", async (req, res) => {
      const acountability = req.accountability;
      if (
        !acountability.user &&
        acountability.role !== "6bbd5c06-ae83-4deb-9611-31a00feb4ce2"
      ) {
        res.send("you_do_not_have_access");
      } else {
        const { id } = req.body;

        const lesson = new ItemsService("lessons", {
          schema: req.schema,
        });

        const session = new ItemsService("sessions", {
          schema: req.schema,
        });

        let info = await lesson.readOne(id).catch((err) => {
          console.log(err);
        });
        let team_id = info.team_id

        let sid;

        let obj = {
          team_id: team_id,
          lesson: {
            id: id,
            published: true,
          },
          session: {
            id: sid,
            published: true,
          },
        };

        let hide = await lesson
          .updateOne(id, {
            published: true,
          })
          .then(() => {
            database("sessions")
              .where({
                lesson_id: id,
              })
              .then(async (data) => {
                sid = data.map((item) => item.id);
                if (sid) {
                  await session.updateMany(sid, {
                    published: true,
                  });
                }
              });
          })
          .catch((err) => {
            console.log(err);
          });

        let obj1 = {
          event: 'restore_lesson',
          data: obj,
          key: 'lkadhjauidfghui2387208sakjldnkalsj872nkmj29'
        }
        axios.post('https://socket.sw.hybrid-class.gr/onupdate', obj1).then((data) => {
          console.log(data)
        }).catch((err) => {
          console.log(err);
        });

        res.send(obj);
      }
    });

    router.post("/pdelete_lesson", async (req, res) => {
      const acountability = req.accountability;
      if (
        !acountability.user &&
        acountability.role !== "6bbd5c06-ae83-4deb-9611-31a00feb4ce2"
      ) {
        res.send("you_do_not_have_access");
      } else {
        const { id } = req.body;

        const lesson = new ItemsService("lessons", {
          schema: req.schema,
        });

        const session = new ItemsService("sessions", {
          schema: req.schema,
        });

        const interactions = new ItemsService("session_interactions", {
          schema: req.schema,
        });

        let info = await lesson.readOne(id).catch((err) => {
          console.log(err);
        });
        let team_id = info.team_id

        let sid = [];
        let intid = [];

        let obj = {
          team_id: team_id,
          lesson: {
            deleted: id,
          },
          session: {
            deleted: sid,
          },
        };

        let myPromise = new Promise((resolve, reject) => {
          database("sessions")
            .where({
              lesson_id: id,
            })
            .then(async (data) => {
              sid = data.map((item) => item.id);
              if (sid) {
                let p = await session.readMany(sid).catch(err => {
                  console.log(err)
                })
                p.forEach(element => {
                  let pin = element.pin
                  const s3Client = new minio.Client({
                    endPoint: 's3.sw.hybrid-class.gr',
                    accessKey: 'FAI7XfSrm6M1sifpz0gH',
                    secretKey: 'u3b3bW25O69jS9YMeUQSufXOvwiOc1xgZP8mmH5v',
                  })

                  let objectsList = []
                  let bucket = 'livekit'
                  let prefix = pin
                  let recursive = true

                  let objectsStream = s3Client.listObjects(bucket, prefix, recursive)
                  objectsStream.on('data', function (obj1) {
                    objectsList.push(obj1)
                  })
                  objectsStream.on('error', function (e) {
                    return console.log('Unable to remove the objects', e)
                  })
                  objectsStream.on('end', function () {
                    s3Client.removeObjects(bucket, objectsList, function (e) {
                      if (e) {
                        return console.log('Unable to remove the objects', e)
                      }
                      console.log('Removed the objects')
                    })
                  })
                });

                sid.forEach(element => {
                  database("session_interactions").where({
                    session_id: element
                  }).then(async (data2) => {
                    intid = data2.map((item) => item.id);
                    if (intid) {
                      await interactions.deleteMany(intid).catch((err) => {
                        console.log(err);
                      });
                    }
                    await session.deleteMany(sid).catch(err => {
                      console.log(err)
                    })
                    resolve(true)
                  })
                })
              }
            })
            .catch((err) => {
              console.log(err);
            });
        })

        await myPromise.then(async (resolve) => {
          await lesson.deleteOne(id).catch(err => {
            console.log(err)
          })

          let obj1 = {
            event: 'delete_lesson',
            data: obj,
            key: 'lkadhjauidfghui2387208sakjldnkalsj872nkmj29'
          }
          axios.post('https://socket.sw.hybrid-class.gr/onupdate', obj1).then((data) => {
            console.log(data)
          }).catch((err) => {
            console.log(err);
          });

          res.send(obj);
        })
      }
    });

    router.post("/pdelete_session", async (req, res) => {
      const acountability = req.accountability;
      if (
        !acountability.user &&
        acountability.role !== "6bbd5c06-ae83-4deb-9611-31a00feb4ce2"
      ) {
        res.send("you_do_not_have_access");
      } else {
        const { id } = req.body;

        const session = new ItemsService("sessions", {
          schema: req.schema,
        });

        const interactions = new ItemsService("session_interactions", {
          schema: req.schema,
        });

        let p = await session.readOne(id).catch(err => {
          console.log(err)
        })
        let pin = p.pin
        let team_id = p.team_id

        let obj = {
          team_id: team_id,
          session: {
            deleted: id,
          },
        };

        database("session_interactions").where({
          session_id: id
        }).then(async (data) => {
          let sid = data.map((item) => item.id);
          if (sid) {
            await interactions.deleteMany(sid).catch((err) => {
              console.log(err);
            });
          }
        })

        await session.deleteOne(id).catch((err) => {
          console.log(err);
        });

        const s3Client = new minio.Client({
          endPoint: 's3.sw.hybrid-class.gr',
          accessKey: 'FAI7XfSrm6M1sifpz0gH',
          secretKey: 'u3b3bW25O69jS9YMeUQSufXOvwiOc1xgZP8mmH5v',
        })

        let objectsList = []
        let bucket = 'livekit'
        let prefix = pin
        let recursive = true

        let objectsStream = s3Client.listObjects(bucket, prefix, recursive)
        objectsStream.on('data', function (obj1) {
          objectsList.push(obj1)
        })
        objectsStream.on('error', function (e) {
          return console.log('Unable to remove the objects', e)
        })
        objectsStream.on('end', function () {
          s3Client.removeObjects(bucket, objectsList, function (e) {
            if (e) {
              return console.log('Unable to remove the objects', e)
            }
            console.log('Removed the objects')
          })
        })

        let obj1 = {
          event: 'delete_session',
          data: obj,
          key: 'lkadhjauidfghui2387208sakjldnkalsj872nkmj29'
        }
        axios.post('https://socket.sw.hybrid-class.gr/onupdate', obj1).then((data) => {
          console.log(data)
        }).catch((err) => {
          console.log(err);
        });

        res.send(obj);
      }
    });

    router.post("/join", async (req, res) => {
      const { pin } = req.body;

      database("sessions")
        .where({
          pin: pin,
        })
        .then(async (data) => {
          if (data.length <= 0) {
            let obj = {
              status: "Pin_does_not_exist",
            };
            res.send(obj);
          } else {
            let index = data.findIndex((x) => x.pin === pin);
            if (data[index].finished === false) {
              if (data[index].live === false) {
                if (data[index].schedule_at !== null) {
                  let obj = {
                    pin: pin,
                    id: data[index].id,
                    status: "Scheduled_at",
                    date: data[index].schedule_at,
                  };
                  res.send(obj);
                } else {
                  let obj = {
                    pin: pin,
                    id: data[index].id,
                    status: "No_schedule",
                  };
                  res.send(obj);
                }
              } else {
                let obj = {
                  pin: pin,
                  id: data[index].id,
                  status: "Live",
                };
                res.send(obj);
              }
            } else {
              let obj = {
                id: data[index].id,
                status: "Finished",
              };
              res.send(obj);
            }
          }
        })
        .catch((err) => {
          console.log(err);
        });
    });

    router.post("/publicToken", async (req, res) => {
      const { pin, name } = req.body;
      let participantName
      const createToken = () => {
        const roomName = pin;
        participantName = name + "_" + Date.now();

        const at = new AccessToken(
          "APIVvAJiDtZNChH",
          "RCVbDiYDq0fvhfhG1Jm9NawKkoEkScdVVjnZjLse1nEA",
          {
            identity: participantName,
          }
        );
        at.addGrant({
          room: roomName,
          roomJoin: true,
          canPublish: false,
          canPublishData: true,
          canSubscribe: true,
        });

        return at.toJwt();
      };

      let obj = {
        token: createToken(),
        participantName: participantName,
      };
      res.send(obj);
    });

    router.post("/getRoom", async (req, res) => {
      const { pin } = req.body;
      const acountability = req.accountability;
      if (
        !acountability.user &&
        acountability.role !== "6bbd5c06-ae83-4deb-9611-31a00feb4ce2"
      ) {
        res.send("you_do_not_have_access");
      } else {
        const team = new ItemsService("teams", {
          schema: req.schema,
        });

        const team_d = new ItemsService("teams_directus_users", {
          schema: req.schema,
        });

        const user = new ItemsService("directus_users", {
          schema: req.schema,
        });

        const pack = new ItemsService("packages", {
          schema: req.schema,
        });

        let me = await user.readOne(acountability.user).catch((err) => {
          console.log(err);
        });

        const t = me.team_id;

        let info = await team.readOne(t).catch((err) => {
          console.log(err);
        });

        let teachers = info.teachers;

        let p = await pack.readOne(info.package).catch((err) => {
          console.log(err);
        });

        let users = await team_d.readMany(teachers).catch((err) => {
          console.log(err);
        });

        if (
          !users
            .map((item) => item.directus_users_id)
            .includes(acountability.user)
        ) {
          return res.send("wrong team");
        }

        const createToken = () => {
          const roomName = pin;
          const participantName =
            me.last_name + " " + me.first_name + " " + "(Teacher)";

          const at = new AccessToken(
            "APIVvAJiDtZNChH",
            "RCVbDiYDq0fvhfhG1Jm9NawKkoEkScdVVjnZjLse1nEA",
            {
              identity: participantName,
            }
          );
          if (p.replay === true) {
            at.addGrant({
              room: roomName,
              roomJoin: true,
              canPublish: true,
              roomList: true,
              canPublishData: true,
              canSubscribe: true,
              roomCreate: true,
              roomAdmin: true,
              roomRecord: true,
            });
          } else {
            at.addGrant({
              room: roomName,
              roomJoin: true,
              canPublish: true,
              roomList: true,
              canPublishData: true,
              canSubscribe: true,
              roomCreate: true,
              roomAdmin: true,
              roomRecord: false,
            });
          }

          return at.toJwt();
        };

        const token = createToken();

        const livekitHost = "https://sfu.hybrid-class.gr";
        const roomService = new RoomServiceClient(
          livekitHost,
          "APIVvAJiDtZNChH",
          "RCVbDiYDq0fvhfhG1Jm9NawKkoEkScdVVjnZjLse1nEA"
        );

        const opts = {
          name: pin,
          emptyTimeout: 10,
          maxParticipants: p.max_remote_participants,
          screenShare: true,
          videoCaptureDefaults: {
            resolution: VideoPresets.h540.resolution,
          },
          publishDefaults: {
            videoCodec: 'h264',
          },
        };

        await roomService
          .createRoom(opts)
          .then((room) => {
            console.log("room created", room);
            let obj = {
              token: token,
            };

            res.send(obj);
          })
          .catch((err) => {
            console.log(err, "error");
          });
      }
    });

    router.post("/updateParticipant", async (req, res) => {
      const { pin, identity, name } = req.body;

      const livekitHost = "https://sfu.hybrid-class.gr";
      const roomService = new RoomServiceClient(
        livekitHost,
        "APIVvAJiDtZNChH",
        "RCVbDiYDq0fvhfhG1Jm9NawKkoEkScdVVjnZjLse1nEA"
      );

      const data = JSON.stringify({
        identity: name,
      });

      await roomService.updateParticipant(pin, identity, undefined, {
        roomJoin: true,
        canPublish: false,
        canPublishData: true,
        canSubscribe: true,
        roomAdmin: true
      }, name).catch((err) => {
        console.log(err);
      });

      let obj = {
        newIdentity: data,
      };

      res.send(obj);
    });

    router.post("/removeParticipant", async (req, res) => {
      const { pin, identity } = req.body;
      const acountability = req.accountability;
      if (
        !acountability.user &&
        acountability.role !== "6bbd5c06-ae83-4deb-9611-31a00feb4ce2"
      ) {
        res.send("you_do_not_have_access");
      } else {
        const team = new ItemsService("teams", {
          schema: req.schema,
        });

        const team_d = new ItemsService("teams_directus_users", {
          schema: req.schema,
        });

        const user = new ItemsService("directus_users", {
          schema: req.schema,
        });

        const pack = new ItemsService("packages", {
          schema: req.schema,
        });

        let me = await user.readOne(acountability.user).catch((err) => {
          console.log(err);
        });

        const t = me.team_id;

        let info = await team.readOne(t).catch((err) => {
          console.log(err);
        });

        let teachers = info.teachers;

        let p = await pack.readOne(info.package).catch((err) => {
          console.log(err);
        });

        let users = await team_d.readMany(teachers).catch((err) => {
          console.log(err);
        });

        if (
          !users
            .map((item) => item.directus_users_id)
            .includes(acountability.user)
        ) {
          return res.send("wrong team");
        }
        const livekitHost = "https://sfu.hybrid-class.gr";
        const roomService = new RoomServiceClient(
          livekitHost,
          "APIVvAJiDtZNChH",
          "RCVbDiYDq0fvhfhG1Jm9NawKkoEkScdVVjnZjLse1nEA"
        );

        await roomService
          .removeParticipant(pin, identity)
          .catch((err) => {
            console.log(err);
          });

        let obj = {
          removed: "Removed " + identity,
        };

        res.send(obj);
      }
    });

    router.post("/record", async (req, res) => {
      const { pin, atrack, vtrack, strack, chapter } = req.body;
      const acountability = req.accountability;
      if (
        !acountability.user &&
        acountability.role !== "6bbd5c06-ae83-4deb-9611-31a00feb4ce2"
      ) {
        res.send("you_do_not_have_access");
      } else {
        const team = new ItemsService("teams", {
          schema: req.schema,
        });

        const team_d = new ItemsService("teams_directus_users", {
          schema: req.schema,
        });

        const user = new ItemsService("directus_users", {
          schema: req.schema,
        });

        const pack = new ItemsService("packages", {
          schema: req.schema,
        });

        const session = new ItemsService("sessions", {
          schema: req.schema,
        });

        let me = await user.readOne(acountability.user).catch((err) => {
          console.log(err);
        });

        const t = me.team_id;

        let info = await team.readOne(t).catch((err) => {
          console.log(err);
        });

        let teachers = info.teachers;

        let p = await pack.readOne(info.package).catch((err) => {
          console.log(err);
        });

        let users = await team_d.readMany(teachers).catch((err) => {
          console.log(err);
        });

        if (
          !users
            .map((item) => item.directus_users_id)
            .includes(acountability.user)
        ) {
          return res.send("wrong team");
        }

        const livekitHost = "https://sfu.hybrid-class.gr";
        const egress = new EgressClient(
          livekitHost,
          "APIVvAJiDtZNChH",
          "RCVbDiYDq0fvhfhG1Jm9NawKkoEkScdVVjnZjLse1nEA"
        );

        // async function video() {
        //   let vid = await egress
        //     .startParticipantEgress(pin, identity, {segments: output}, {screen_share: true})
        //     .catch((err) => {
        //       console.log(err, "video_error");
        //     });
        // }

        async function video() {
          const output = {
            filepath: pin + "/vtrack" + chapter + '.mp4',
            s3: {
              accessKey: "FAI7XfSrm6M1sifpz0gH",
              secret: "u3b3bW25O69jS9YMeUQSufXOvwiOc1xgZP8mmH5v",
              bucket: "livekit/",
              endpoint: "s3.sw.hybrid-class.gr",
            },
          };

          let vid = await egress
            .startTrackEgress(pin, output, vtrack)
            .catch((err) => {
              console.log(err, "video_error");
            });
        }

        async function audio() {
          const output = {
            filepath: pin + "/atrack" + chapter,
            s3: {
              accessKey: "FAI7XfSrm6M1sifpz0gH",
              secret: "u3b3bW25O69jS9YMeUQSufXOvwiOc1xgZP8mmH5v",
              bucket: "livekit/",
              endpoint: "s3.sw.hybrid-class.gr",
            },
          };

          let sound = await egress
            .startTrackEgress(pin, output, atrack)
            .catch((err) => {
              console.log(err, "audio_error");
            });
        }

        async function screenShare() {
          const output = {
            filepath: pin + "/strack" + chapter + '.mp4',
            s3: {
              accessKey: "FAI7XfSrm6M1sifpz0gH",
              secret: "u3b3bW25O69jS9YMeUQSufXOvwiOc1xgZP8mmH5v",
              bucket: "livekit/",
              endpoint: "s3.sw.hybrid-class.gr",
            },
          };

          let screen = await egress
            .startTrackEgress(pin, output, strack)
            .catch((err) => {
              console.log(err, "screen_error");
            });
        }

        if (vtrack) {
          await video();
        }
        if (atrack) {
          await audio();
        }
        if (strack) {
          await screenShare();
        }

        let obj = {
          record: "record in room " + pin + " started",
        };
        res.send(obj);
      }
    });

    router.post("/stopRecord", async (req, res) => {
      const { pin } = req.body;
      const acountability = req.accountability;
      if (
        !acountability.user &&
        acountability.role !== "6bbd5c06-ae83-4deb-9611-31a00feb4ce2"
      ) {
        res.send("you_do_not_have_access");
      } else {
        const team = new ItemsService("teams", {
          schema: req.schema,
        });

        const team_d = new ItemsService("teams_directus_users", {
          schema: req.schema,
        });

        const user = new ItemsService("directus_users", {
          schema: req.schema,
        });

        const pack = new ItemsService("packages", {
          schema: req.schema,
        });

        let me = await user.readOne(acountability.user).catch((err) => {
          console.log(err);
        });

        const t = me.team_id;

        let info = await team.readOne(t).catch((err) => {
          console.log(err);
        });

        let teachers = info.teachers;

        let p = await pack.readOne(info.package).catch((err) => {
          console.log(err);
        });

        let users = await team_d.readMany(teachers).catch((err) => {
          console.log(err);
        });

        if (
          !users
            .map((item) => item.directus_users_id)
            .includes(acountability.user)
        ) {
          return res.send("wrong team");
        }
        const livekitHost = "https://sfu.hybrid-class.gr";
        const egress = new EgressClient(
          livekitHost,
          "APIVvAJiDtZNChH",
          "RCVbDiYDq0fvhfhG1Jm9NawKkoEkScdVVjnZjLse1nEA"
        );

        let roomName = pin
        let e = []

        //egress status analyze
        // { no: 0, name: "EGRESS_STARTING" },
        // { no: 1, name: "EGRESS_ACTIVE" },
        // { no: 2, name: "EGRESS_ENDING" },
        // { no: 3, name: "EGRESS_COMPLETE" },
        // { no: 4, name: "EGRESS_FAILED" },
        // { no: 5, name: "EGRESS_ABORTED" },
        // { no: 6, name: "EGRESS_LIMIT_REACHED" },

        egress.listEgress(roomName).then((data) => {
          data.forEach(element => {
            if (element.status === 1 || element.status === 2) {
              e.push(element.egressId)
            }
          });
        }).then(() => {
          e.forEach(element => {
            let stop = egress
              .stopEgress(element)
              .then((data) => {
                console.log(data);
              })
              .catch((err) => {
                console.log(err);
              });
          });
        }).catch((err) => {
          console.log(err);
        });

        let obj = {
          record: "record in room " + pin + " stopped",
        };
        res.send(obj);
      }
    });

    router.post("/patchSession", async (req, res) => {
      const acountability = req.accountability;
      if (
        !acountability.user &&
        acountability.role !== "6bbd5c06-ae83-4deb-9611-31a00feb4ce2"
      ) {
        res.send("you_do_not_have_access");
      } else {
        const { id, live, finished } = req.body;

        const session = new ItemsService("sessions", {
          schema: req.schema,
        });

        let info = await session.readOne(id).catch((err) => {
          console.log(err);
        });
        let version = info.version
        version++

        await session
          .updateOne(id, {
            live: live,
            finished: finished,
            version: version
          })
          .catch((err) => {
            console.log(err);
          });

        let obj = {
          session: {
            id: id,
            live: live,
            finished: finished,
            version: version
          },
        };

        res.send(obj);
      }
    });

    router.post("/participant", async (req, res) => {
      const { pin, name, joined, pass, exited, identity } = req.body;
      const password = pass;
      if (password !== "ngeiyltgxyijukdsaxgh") {
        res.send("you_do_not_have_access");
      } else {
        const participant = new ItemsService("Participant", {
          schema: req.schema,
        });

        if (joined) {
          let p = await participant
            .createOne({
              participant: name,
              room: pin,
              joined: joined,
            })
            .catch((err) => {
              console.log(err, "error");
            });
          let obj = {
            Participant_id: p,
          };
          res.send(obj);
        }

        if (identity) {
          database("Participant").where({
            participant: identity,
            room: pin
          }).then(async (data) => {
            let index = data.findIndex((x) => x.participant === identity)
            await participant.updateOne(data[index].id, {
              participant: name
            }).catch((err) => {
              console.log(err, "error");
            });
          }).catch((err) => {
            console.log(err, "error");
          });
          let obj = {
            Participant_renamed: name,
          };
          res.send(obj);
        }

        if (exited) {
          database("Participant").where({
            participant: name,
            room: pin
          }).then(async (data) => {
            let index = data.findIndex((x) => x.participant === name)
            await participant.updateOne(data[index].id, {
              exited: exited
            }).catch((err) => {
              console.log(err, "error");
            });
          }).catch((err) => {
            console.log(err, "error");
          });
          let obj = {
            Participant_exited: exited,
          };
          res.send(obj);
        }
      }
    });

    router.post("/interactions", async (req, res) => {
      const { type, pass, session_id, data } = req.body;
      const password = pass;
      if (password !== "ngeiyltgxyijukdsaxgh") {
        res.send("you_do_not_have_access");
      } else {
        const interaction = new ItemsService("session_interactions", {
          schema: req.schema,
        });

        let int = await interaction
          .createOne({
            type: type,
            session_id: session_id,
            data: data
          })
          .catch((err) => {
            console.log(err, "error");
          });
        let obj = {
          interaction: int,
        };

        res.send(obj);
      }
    });

    // router.post("/testMinio", async (req, res) => {
    //   const acountability = req.accountability;
    //   if (
    //     !acountability.user &&
    //     acountability.role !== "6bbd5c06-ae83-4deb-9611-31a00feb4ce2"
    //   ) {
    //     res.send("you_do_not_have_access");
    //   } else {

    //     const { ses_id } = req.body

    //     const session = new ItemsService("sessions", {
    //       schema: req.schema,
    //     });

    //     let info = await session.readOne(ses_id).catch(err => {
    //       console.log(err)
    //     })
    //     let pin = info.pin

    //     // let files = fs.readdirSync('database/' + pin)
    //     // console.log(files.filter(x => x.indexOf('.json') === -1))

    //     database("session_interactions").where({
    //       session_id: ses_id
    //     }).then((data) => {
    //       let index = data.findIndex((x) => x.session_id === ses_id)
    //       let started = data[index].started
    //       let ended = data[index].ended
    //       let screen_started = data[index].screen_share_started
    //       let screen_finished = data[index].screen_share_finished
    //     }).catch(err => {
    //       console.log(err)
    //     })

    //     const ffmpeg = new FFmpeg();
    //     await ffmpeg.load();
    //     // await ffmpeg.writeFile('database/' + pin + '/vtrack1.webm', 'database/' + pin + '/atrack1.ogg')
    //     await ffmpeg.exec(["-i", 'database/' + pin + '/vtrack1.webm', "-i", 'database/' + pin + '/atrack1.ogg', "-c:v", "copy", "-c:a", "aac", 'database/' + pin + '/merged.mp4']);
    //     const data = ffmpeg.readFile('database/' + pin + '/merged.mp4');

    //     // ffmpeg
    //     //   .addInput('database/' + pin + '/vtrack1.webm')
    //     //   .addInput('database/' + pin + '/atrack1.ogg')
    //     //   .addOptions(['-map 0:v', '-map 1:a', '-c:v copy'])
    //     //   .format('mp4')
    //     //   .on('error', error => console.log(error))
    //     //   .on('end', console.log(' finished !'))
    //     //   .saveToFile('database/' + pin + '/merged.mp4').catch(err => {
    //     //     console.log(err)
    //     //   })
    //   }

    //   let obj = {
    //     done: 'egine'
    //   }

    //   res.send(obj)
    // });

    router.get("/checkVideo", async (req, res) => {
      console.log('request from nginx', req.body)
      res.send(true)
    });

    // router.post("/chat", async (req, res) => {
    //   const { strData, room } = req.body
    //   const Data = JSON.stringify(strData )
    //   const encoder = new TextEncoder()

    //   const r = new Room(room)

    //   const data = encoder.encode(Data)

    //   r.localParticipant
    //     .publishData(data, DataPacket_Kind.LOSSY)
    //     .catch((err) => {
    //       console.log(err, "publish data error");
    //     });

    //   res.send(Data)

    // });
  },
};
